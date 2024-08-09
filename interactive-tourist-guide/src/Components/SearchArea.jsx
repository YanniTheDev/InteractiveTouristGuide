import { useState } from "react";

import Axios from "axios";

import "../ComponentCSS/SearchArea.css";
import "../Reusables.css"

export const SearchArea = () => {

    const [address, setAddress] = useState("");
    const getAddress = (event) => {
        setAddress(event.target.value);
    }
    
    const [maxTravelDistance, setMaxTravelDistance] = useState(0);
    const getMaxTravelDistance = (event) => {
        setMaxTravelDistance(event.target.value);
    }

    const apiKey = import.meta.env.VITE_HERE_API_KEY;

    const geoCodeAddress = () => {
        let url = `https://geocode.search.hereapi.com/v1/geocode?q=${address}&apiKey=${apiKey}`

        //API REQUEST!
        Axios.get(url).then((response) => {

            //Weird React thing going on. Why make new variable am i right???
            let apiResponse = response;
            let apiResponseCoords = response.data.items[0].position;

            console.log(apiResponse);
            console.log(apiResponseCoords);

            findPetrolStations(apiResponseCoords);

        }).catch((error) => {
            console.error(error);
        })
    }

    const findPetrolStations = (coords) => {
        let url = `https://discover.search.hereapi.com/v1/discover?at=${coords.lat},${coords.lng}&q=petrol+station&apiKey=${apiKey}`
    
        //API REQUEST!!
        Axios.get(url).then((response) => {

            //Weird React thing going on. Why make new variable am i right???
            let petrolStations = response.data.items;

            let validPetrolStations = petrolStations.filter((element) => {
                return element.distance <= maxTravelDistance;
            })

            console.log(petrolStations);
            console.log(validPetrolStations);

        }).catch((error) => {
            console.error(error);
        })
    }

    return (
        <div className="search-area flex-dir-col flex-c-c">
            <div className="address-container flex-dir-col flex-c-c">
                <h1>Enter Your Address</h1>

                <input type="text" placeholder="e.g. 3 Jo Road, Nelson, New Zealand" onChange={getAddress}/>
            </div>

            <div className="distance-container flex-dir-col flex-c-c">
                <h1>Maximum Travel Distance</h1>

                <input type="number" placeholder="e.g. 35" onChange={getMaxTravelDistance}/>
            </div>

            <button onClick={geoCodeAddress}>
                Find Restaurants
            </button>
        </div>
    );
}