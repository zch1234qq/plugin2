import Shell from "../shell1";
import { useEffect, useRef, useState } from "react";
import { NodeData, Res } from "../../../common/types/types";
import '../style.css'
import { Upload } from "antd";
import { fileToText } from "../../../common/file-converter";
import utils, { updateResData } from "../../../common/utils";
import ComHandleDot from "../../ComHandleDot";
import HandleOutputText from "../../HandleOutputText";
export default function InFile({id,data}:{id:string,data:NodeData}){
  const [updateFlag,setUpdateFlag]=useState(false)
  const [content,setContent]=useState("")
  const contentRef=useRef(content)
  const refFileName=useRef("")
  const refTypeFile=useRef("")


  const runs: Record<string, (res:Res) => Promise<Res>> = {
    "0":run
  };
  async function run(input:Res):Promise<Res>{
    var result:Res={
      ...input,
      success:true,
      msg:contentRef.current,
      datas:{
        name:refFileName.current
      }
    } as Res
    if(refTypeFile.current=="xlsx"||refTypeFile.current=="xls"){
      result=updateResData(result,{msgtypeRe:"excel"})
    }else{
      result=updateResData(result,{msgtypeRe:"text"})
    }

    utils.log(contentRef.current);
    return result
  }
  
  function onClick(){
    utils.log(id);
  }

  useEffect(()=>{
    setUpdateFlag(!updateFlag)
    contentRef.current=content
    utils.log("update");
  },[content])

  return(
    <Shell data={data} updateFlag={updateFlag} root={true} id={id} runs={runs} onClick={onClick}>
      <ComHandleDot/>
      <HandleOutputText />
      <Drager setContent={setContent} refFileName={refFileName} refTypeFile={refTypeFile}/>
    </Shell>
  )
}

function Drager({setContent,refFileName,refTypeFile}:{setContent:React.Dispatch<React.SetStateAction<string>>,refFileName:React.MutableRefObject<string>,refTypeFile:React.MutableRefObject<string>}){
  const title="点击或拖拽文件到此处"
  const [showText,setShowText]=useState(title)
  return(
    <Upload.Dragger style={{height:"100%",overflow:"hidden"}} name="file" accept=".txt,.csv,.doc,.docx,.xlsx,.xls,.pdf"  showUploadList={false}
      beforeUpload={async (file)=>{
        let result=await fileToText(file)
        utils.log(result);
        setShowText(result)
        setContent(result)
        refFileName.current=file.name
        //提取文件后缀
        refTypeFile.current=file.name.split(".").pop()||""
        return false
    }}>
      <div style={{flex:1,height:"100%",width:"100%"}}>
        <p>{showText}</p>
      </div>
    </Upload.Dragger>
  )
}