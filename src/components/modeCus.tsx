import { Modal } from "antd";
import TextArea from "antd/es/input/TextArea";
import { useRef } from "react";

type Argvs={
  open:boolean,
  setOpen:Function,
  value:string,
  onChange:(e:any)=>void
  placeholder?:string,
}

export default function ModalCus({open,setOpen,value,onChange,placeholder="请输入"}:Argvs) {
  const textAreaRef = useRef<any>(null);
  
  const handleAfterOpen = (visible: boolean) => {
    if (visible && textAreaRef.current) {
      textAreaRef.current.focus();
      // 将光标移动到文本末尾
      const textArea = textAreaRef.current.resizableTextArea.textArea;
      const length = value.length;
      setTimeout(() => {
        textArea.setSelectionRange(length, length);
      }, 0);
    }
  };
  
  return(
    <Modal open={open} footer={null} onCancel={()=>{setOpen(false)}} afterOpenChange={handleAfterOpen}>
      <TextArea
        ref={textAreaRef}
        autoSize={true}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      />
    </Modal>
  )
}