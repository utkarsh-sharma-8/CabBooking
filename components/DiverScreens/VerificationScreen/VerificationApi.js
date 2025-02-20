import axios from 'axios';
import {baseUrl} from "../../../utils/constants"
const VerificationApi=async(data)=>{
    console.log('verification api called')
    try{
        const response= await axios.post(`${baseUrl}/add-driver`,data,{
            headers:{
                "Content-Type":'application/json'
            },
        });
        // console.log(`response to auth api is ${JSON.stringify(response.data,null,2)}`);
        return response.data;
    }catch(error){
        console.log(`Error login ${error}`);
        throw new Error("Error in login please try again later")
    }
}

export default VerificationApi;