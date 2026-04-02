import { useEffect, useState } from "react";
import ComDrawerStatic from "./ComDrawerStatic/index";
import { useAtomValue } from "jotai";
import { stateDebug } from "../common/store/store.tsx";
export default function ComDrawer({content="",buttonShare}:{content:string,buttonShare?: React.ReactNode}){
  const [displayContent, setDisplayContent] = useState("");
  const debug=useAtomValue(stateDebug)
  
  useEffect(() => {
    if(debug.msgtype!="text"){
      setDisplayContent(debug.data)
      return
    }
    if (content) {
      let contentTemp=content;
      if(contentTemp.substring(0,10)=="data:image"){
        contentTemp="[图片信息]"
      }
      let currentIndex = 0;
      const interval = setInterval(() => {
        let temp=contentTemp.slice(0, currentIndex);
        if (currentIndex <= contentTemp.length) {
          setDisplayContent(temp);
          currentIndex++;
        } else {
          clearInterval(interval);
        }
        
      }, 100);
      return () => clearInterval(interval);
    }
  }, [content,debug]);

  return(
    <ComDrawerStatic content={displayContent} buttonShare={buttonShare}></ComDrawerStatic>
  )
}
