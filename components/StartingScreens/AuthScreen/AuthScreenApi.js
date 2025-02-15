import axios from 'axios';
import {baseUrl} from "../../../utils/constants"
const AuthApi=async(data)=>{
    try{
        const response= await axios.post(`http://192.168.1.11:3000/api/auth`,data,{
            headers:{
                "Content-Type":'application/json'
            },
        });
        console.log(`response to auth api is ${JSON.stringify(response.data,null,2)}`);
        return response.data
    }catch(error){
        console.log(`Error login ${error}`);
        throw new Error("Error in login please try again later")
    }
}

export default AuthApi;