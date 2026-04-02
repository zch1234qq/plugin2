import { NodeData, Res } from "../../../common/types/types.tsx";
import NodeCore0 from "../_node0.tsx";
import { Dropdown, Button, Menu } from "antd";
import aiShellService from "../../../common/service/aiShellService";
import { updateResData } from "../../../common/utils.tsx";
import { useEffect, useState } from "react";
import utilsImg from "../../../common/utilsImg.tsx";
import HandleInputImg from "../../HandleInputImg.tsx";
import HandleOutputText from "../../HandleOutputText.tsx";

export default function OCR({id,data}:{id:string,data:NodeData}){
  const [v0, setV0] = useState(data.values[0]||'0');
  const [v1, _] = useState(data.values[1]||'0');
  useEffect(()=>{
    data.values[0]=v0
  },[v0])
  useEffect(()=>{
    data.values[1]=v1
  },[v1])

  //增加下拉框  来选择不同的ocr模式
  const ocrOptions = [
    { value: '0', label: '元素' },
    { value: '1', label: '表格' },
    { value: '2', label: '文章' },
  ];
  
  async function run0(input:Res):Promise<Res> {
    if (!input.msg.startsWith('data:image')&&!input.msg.startsWith('http')) {
      return updateResData(input,{success: false,msg: "输入必须是图片"});
    }else if(input.msg.startsWith('http')){
      //将网络图片转为  dataurl图片
      try {
        input.msg=await utilsImg.processHttpImageWithSampling(input.msg, 0.9)
      } catch (error) {
        console.error('网络图片处理失败:', error);
      }
    }
    var mode=data.values[0]||"0"
    if(mode==='1'){
      let prompt="我有一张图片，其中包含一个表格，表格有列名和多行数据。请你帮我将它提取出来，并且转成标准的 CSV 格式。要求使用英文逗号分隔，\n 表示换行，第一行为列名，只返回 CSV 纯文本字符串，不要任何额外描述或解释。"
      let ques="请将这张图片的表格数据转换为标准 CSV 格式。"
      const result = await aiShellService.GptImg(
        prompt,
        input.msg,
        ques,
        data.sharer
      );
      if (!result.data.success) {
        result.data.msg=result.data.message
        if(result.data.code==0){
          throw new Error(result.data.message||"处理失败")
        }
      }
      return updateResData(input,{success: result.data.success,msg:result.data.msg,msgtypeRe:"excel"});
    }

    
    
    var prompt=mode
    if(mode==='0'){
      prompt="0"
    }
    await aiShellService.GptOcr(prompt,input.msg,"",data.sharer)
    .then(res=>{
      var _data=res.data
      input.success=_data.success
      input.msg=_data.msg
      if (_data.success) {
        //移除结果中出现的markdown格式的图片
        // 匹配 ![alt text](url "title") 格式的markdown图片
        _data.msg=_data.msg.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
        _data.msg=_data.msg.replace(/\n\n/g, '\n')
        _data.msg=_data.msg.replaceAll(",","，")
        switch(mode){
          case '1':
            input.msgtypeRe="md"
            if(data.values[1]==='1'){
              //提取所有表格内容，移除表格标签之外的所有信息
              const tableMatches = _data.msg.matchAll(/<table[\s\S]*?<\/table>/gi);
              const tables = Array.from(tableMatches, match => match[0]).join('');
              if (tables) {
                _data.msg = tables;
              }
              //将所有html的table转为 csv格式
              try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(_data.msg, 'text/html');
                const tables = doc.querySelectorAll('table');
                
                if (tables.length > 0) {
                  let csv = '';
                  // 遍历所有表格
                  tables.forEach((table, tableIndex) => {
                    // 如果有多个表格，添加分隔符
                    if (tableIndex > 0) {
                      csv += '\n\n';
                    }
                    
                    const rows = table.querySelectorAll('tr');
                    rows.forEach(row => {
                      const cells = row.querySelectorAll('td, th');
                      const rowData:string[] = [];
                      cells.forEach(cell => {
                        // 移除单元格中的 HTML 标签，保留文本内容
                        const text = cell.textContent?.trim() || '';
                        // 处理包含逗号的文本，用引号包裹
                        const escapedText = text.includes(',') || text.includes('"') ? `"${text.replace(/"/g, '""')}"` : text;
                        rowData.push(escapedText);
                      });
                      csv += rowData.join(',') + '\n';
                    });
                  });
                  _data.msg = csv;
                  // 输出格式设置为 excel
                  input.msgtypeRe = "excel";
                }
              } catch (error) {
                console.error('HTML表格转CSV失败:', error);
                // 转换失败时保持原HTML内容
              }
            }
            break;
          default:
            input.msgtypeRe="text"
            break;
        }
      }else{
        input.msg=_data.message
        if(_data.code==0){
          throw new Error(_data.message)
        }
      }
    })
    .catch(error=>{
      throw error
    })
    return updateResData(input,{headers:""});
  }

  return (
    <NodeCore0 handles={[0,-1]} run0={run0} id={id} data={data}>
      <HandleInputImg />
      <HandleOutputText />
      <div onClick={(e) => e.stopPropagation()}>
        <Dropdown
          overlay={
            <Menu
              onClick={(e) => {
                e.domEvent.stopPropagation();
                setV0(e.key);
              }}
              items={ocrOptions.map(option => ({
                key: option.value,
                label: option.label
              }))}
            />
          }
          trigger={['click']}
          arrow={true}
        >
          <Button
            type="text"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{ width: '100%', textAlign: 'left' }}
          >
            {ocrOptions.find(opt => opt.value === v0)?.label || '选择模式'}
          </Button>
        </Dropdown>
      </div>
    </NodeCore0>
  )
}