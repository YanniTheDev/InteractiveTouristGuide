//Using the CSS file FOR this component
import "../ComponentCSS/MapArea.css";

import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import H from "@here/maps-api-for-javascript";

export const Map = forwardRef(({ apiKey, userCoord, finishLoading, isMobile }, ref) => {

    const mapRef = useRef(null);
    const map = useRef(null);
    const platform = useRef(null);
    const group = useRef(null);

    let newMap = null;

    useEffect(() => {
        if (!map.current) {

            // Create a platform object with the API key and useCIT option
            platform.current = new H.service.Platform({
                apiKey
            });

            // Obtain the default map types from the platform object:
            const defaultLayers = platform.current.createDefaultLayers({
                pois: true
            });

            // Create a new map instance with the Tile layer, center and zoom level
            // Instantiate (and display) a map:
            newMap = new H.Map(
                mapRef.current,
                defaultLayers.vector.normal.map, {
                    zoom: 3.5,
                    center: {
                        // ...zoomCenter,
                        ...userCoord,
                    },
                }
            );

            // Add panning and zooming behavior to the map
            const behavior = new H.mapevents.Behavior(
                new H.mapevents.MapEvents(newMap)
            );
            
            // Set the map object to the reference
            map.current = newMap;

            window.addEventListener("resize", () => {
                return map.current.getViewPort().resize();
            });

            //Calls the function to add info bubbles to the markers
            const ui = H.ui.UI.createDefault(map.current, defaultLayers);
            addInfoBubbles(ui);
        }
    }, [apiKey]);

    //Exposes the displayMap function to the parent component
    useImperativeHandle(ref, () => {
        return {
            addRestaurantMarkers: addRestaurantMarkers,
            handleRoutes: handleRoutes
        }
    });

    const addRestaurantMarkers = (inDistanceRestaurants) => {
        
        //Removes all objects such as markers
        map.current.removeObjects(map.current.getObjects());

        // Define a variable holding SVG mark-up that defines an icon image:
        const svgMarkup = '<svg width="50" height="24" ' +
        'xmlns="http://www.w3.org/2000/svg">' +
        '<rect stroke="white" fill="#1b468d" x="1" y="1" width="50" ' +
        'height="22" /><text x="25" y="17" font-size="12pt" ' +
        'font-family="Arial" font-weight="bold" text-anchor="middle" ' +
        'fill="white">Start</text></svg>';
        const icon = new H.map.Icon(svgMarkup);
        const homeMarker = new H.map.Marker(userCoord, { icon: icon});

        map.current.addObject(homeMarker);
        
        //Loops over each restaurant property in the object and adds a marker on the map for that restaurant
        inDistanceRestaurants.forEach(element => {

            console.log(element);
            
            const html = (
                `<h2>${element.title}</h2>` +
                `<h4>${element.address.houseNumber} ${element.address.street}</h4>`
            );

            let restaurantMarker = new H.map.Marker({lat: element.position.lat, lng: element.position.lng});
            restaurantMarker.setData(html);

            try {
                map.current.addObject(restaurantMarker);
            } catch (error) {
                console.log(error)
            }
        });
    }

    const addInfoBubbles = (ui) =>  {

        //Adds the tap event listener
        map.current.addEventListener("tap", (event) => {

            console.log(event);

            if (event.target instanceof H.map.Marker) {
                // event target is the marker itself, group is a parent event target
                // for all objects that it contains
                const bubble = new H.ui.InfoBubble(event.target.getGeometry(), {
    
                    //Reads the data
                    content: event.target.getData()
                });
                
                //adds the info bubble
                ui.addBubble(bubble);
            }

        }, false);
    }
    
    //plaform -> platform.current, map -> map.current, start -> userCoord, destination -> inDistanceRestaurants

    const handleRoutes = (inDistanceRestaurants) => {
        
        //Calculates route for each restaurant
        inDistanceRestaurants.forEach((element) => {
            setTimeout(() => {
                calculateRoute(element);
            }, 1000)
        });

        setTimeout(() => {
            finishLoading();
        }, 2000)
    }

    const calculateRoute = (element) => {

        const routeResponseHandler = (response) => {

            const sections = response.routes[0].sections;
            const lineStrings = [];

            sections.forEach((section) => {
                //Converts the flexible polyline encoded string to geometry
                lineStrings.push(H.geo.LineString.fromFlexiblePolyline(section.polyline));
            });

            const multiLineString = new H.geo.MultiLineString(lineStrings);
            const bounds = multiLineString.getBoundingBox();

            //Create the polyline for the route
            const routePolyline = new H.map.Polyline(multiLineString, {
                style: {
                    lineWidth: 5
                }
            });

            //Add the polyline to the map
            map.current.addObject(routePolyline);
            
            //Make it so that the map automatically zooms into the user and the restaurants
            map.current.getViewModel().setLookAtData({ bounds });
        }

        //Gets an instance of the H.service.RoutingService8 service
        const router = platform.current.getRoutingService(null, 8);

        //Defines the routing service parametres
        const routingParams = {
            'origin': `${userCoord.lat},${userCoord.lng}`,
            'destination': `${element.position.lat},${element.position.lng}`,
            'transportMode': 'car',
            'return': 'polyline'
        };

        //Calls the routing service with the defined parametres
        router.calculateRoute(routingParams, routeResponseHandler, console.error);
    }

    return (
        <div className="map-area flex-c-c flex-dir-row" ref={mapRef}>
            {/* <h1><b>MAP STUFF HERE</b></h1> */}

        </div>
    );
});