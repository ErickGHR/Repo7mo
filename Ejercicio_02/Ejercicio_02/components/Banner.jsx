import { Stylesheet, View} from "react-native";
export default function Banner ({children}){
    return(
        <view>
            {children}
        </view>
    );
}

const styles=Stylesheet.create({
    texto:{
        color:"red"
    },
})