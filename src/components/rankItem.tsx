import { Flex } from "antd";
import { Packaging } from "../common/classes";

export default function RankItem({rankindex,name,id,setPackaging}:{rankindex:number,name:string,id:number,setPackaging:React.Dispatch<React.SetStateAction<Packaging>>}) {
  async function getPackaging(){
    setPackaging(new Packaging(id,name,"这是用于检测天空云朵的算法,如果有云返回1,无云返回0,天空中云彩小于20%的话视为无云"))
  }

  return(
    <Flex style={{userSelect:"none",cursor:"pointer"}} onClick={()=>{
      getPackaging()
    }} gap={"small"}>
      <div>{rankindex+1}</div>
      <div>{name}</div>
    </Flex>
  )
}