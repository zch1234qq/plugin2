import { useRef, useState, useEffect } from "react";
import { NodeData, Res } from "../../../common/types/types";
import '../style.css'
import { Checkbox, Input, Modal, Tooltip, theme as antdTheme } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import NodeCore0 from "../_node0";
import { CSSProperties } from "react";
import mqrb from "../../../common/service/mqrb";
// import ComOcrMode from "../../ComOcrMode";
import { updateResData } from "../../../common/utils";
import utilsImg from "../../../common/utilsImg";
import FieldPopover from "../../FieldPopover";

/**
 * 图片转表格行节点组件
 * 从图片中提取数据并转换为CSV格式的一行
 * @param {Object} props - 组件属性
 * @param {string} props.id - 节点ID
 * @param {NodeData} props.data - 节点数据
 * @returns {JSX.Element} 图片转表格行节点组件
 */
const maxFields = 7;
export default function ImgToRow({id, data}: {id: string, data: NodeData}) {
  const { token } = antdTheme.useToken();
  const fontSizeXS = token.fontSizeSM * 0.75;
  const styles = createStyles(token);
  // 提示词
  const [v0] = useState("");
  const v0Ref = useRef(v0);
  
  
  // 字段列表
  const [fields, setFields] = useState<string[]>([]);
  const fieldsRef = useRef<string[]>([]);

  // 多行模式
  const [multiLineMode, setMultiLineMode] = useState(data.values[0] === "1");
  const multiLineModeRef = useRef(multiLineMode);
  
  // 新字段输入
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  // 修改字段
  const [editVisible, setEditVisible] = useState(false);
  const [editIndex, setEditIndex] = useState(-1);
  // 初始化数据
  useEffect(() => {
    // 初始化字段列表
    if (data.values[1]) {
      try {
        const savedFields = JSON.parse(data.values[1]);
        if (Array.isArray(savedFields)) {
          setFields(savedFields);
          fieldsRef.current = savedFields;
        }
      } catch (e) {
        console.error("解析字段数据失败", e);
      }
    }
    
    // 初始化OCR模式
    if (data.values[2] === undefined) {
      data.values[2] = "0";
    }

    // // 初始化多行模式（默认开启）
    // const savedMultiLineMode = data.values[0];
    // const isMultiLineMode = savedMultiLineMode === "1";
    // setMultiLineMode(isMultiLineMode);
    // multiLineModeRef.current = isMultiLineMode;
  }, []);

  // 更新提示词引用
  useEffect(() => {
    v0Ref.current = v0;
  }, [v0]);


  // 保存字段列表到data
  useEffect(() => {
    data.values[1] = JSON.stringify(fields);
    fieldsRef.current = fields;
  }, [fields]);

  // 保存多行模式到data
  useEffect(() => {
    data.values[0] = multiLineMode ? "1" : "0";
    multiLineModeRef.current = multiLineMode;
  }, [multiLineMode]);

  // 添加字段
  const handleAddField = () => {
    if (inputValue && fields.indexOf(inputValue) === -1) {
      const newFields = [...fields, inputValue];
      setFields(newFields);
      setInputValue('');
    }
    setInputVisible(false);
  };

  // 删除字段
  const handleDeleteField = (removedField: string) => {
    const newFields = fields.filter(field => field !== removedField);
    setFields(newFields);
  };

  // 修改字段
  const handleEditField = () => {
    if (inputValue && editIndex >= 0) {
      const newFields = [...fields];
      newFields[editIndex] = inputValue;
      setFields(newFields);
      setInputValue('');
      setEditIndex(-1);
    }
    setEditVisible(false);
  };

  // 开始修改字段
  const startEditField = (index: number) => {
    setEditIndex(index);
    setInputValue(fields[index]);
    setEditVisible(true);
  };

  /**
   * 处理图像并提取数据
   * @param {Res} input - 输入图像
   * @returns {Promise<Res>} 处理结果，CSV格式的一行或多行
   */
  async function run(input: Res): Promise<Res> {
    if (!input.success) {
      return input;
    }
    if (!input.msg.startsWith('data:image')&&!input.msg.startsWith('http')) {
      return updateResData(input,{success: false,msg: "输入必须是图片"});
    }else if(input.msg.startsWith('http')){
      //将网络图片转为  dataurl图片
      try {
        input.msg=await utilsImg.processHttpImageWithSampling(input.msg, 0.9)
      } catch (error) {
        console.error('网络图片处理失败:', error);
        // 出错时尝试直接使用URL
      }
    }
    if(fieldsRef.current.length===0){
      setInputVisible(true)
      return updateResData(input,{
        success: false,
        msg: "请补充需要提取的信息名称"
      });
    }
    let headers=fieldsRef.current.join(",")
    try {
      // 构建提示词
      let prompt="帮我从输入的图片中提取" + headers + `，这${fieldsRef.current.length}种信息,按顺序输出,并使用&分隔。`
      if(multiLineModeRef.current){
        prompt=prompt+"多组信息之间注意用回车分隔"
      }
      prompt=prompt+"如果对应信息不存在，则使用汉字“无”占位。"
      let result = await mqrb.GptImg(
          "",
          input.msg,
          prompt,
          data.sharer
        );
      if (!result.data.success) {
        result.data.msg=result.data.message
        if(result.data.code==0){
          throw new Error(result.data.message||"处理失败")
        }
      }else{
        // 处理返回的数据，确保是CSV格式
        let csvData = result.data.msg.trim();
        // 移除可能存在的代码块标记
        csvData = csvData.replace(/```csv\s*/g, "").replace(/```\s*$/g, "");
        if (fieldsRef.current.length === 1) {
          csvData=csvData.replaceAll("&","\n")
        }
        csvData=csvData.replaceAll(",","，").replaceAll("&",",")
        csvData=csvData.replaceAll(headers,"")
        if (!multiLineModeRef.current) {
          const firstLine = csvData
            .split(/\r?\n/)
            .map(line => line.trim())
            .find(line => line.length > 0) || "";
          result.data.msg = firstLine;
          return updateResData(
            input,{success: result.data.success,msg:result.data.msg,msgtypeRe:"excel",headers:headers}
          );
        }
        result.data.msg=csvData
      }
      return updateResData(
        input,{success: result.data.success,msg:result.data.msg,msgtypeRe:"excel",headers:headers}
      );
      
    } catch (error: any) {
      throw error;
    }
  }

  return (
    <div className="img-to-row-container" style={{ width: '100%' }}>
      <NodeCore0
        root={false}
        handles={[1, 1]}
        colors={[0, 1]} // 输入为红色（图片），输出为默认色（文本）
        run0={run}
        id={id}
        data={data}
      >
        
        {/* 多行模式复选框 */}
        {/* <Flex gap={10}>
          <Switch
            checked={multiRowMode}
            onChange={e => {
              setMultiRowMode(e);
              window.messageApi.info(`${e ? "提取多行" : "提取单行行"}`)
            }}
          />
          <span style={{fontSize:"15px"}}>{multiRowMode ? "提取多行" : "提取一行"}</span>
        </Flex> */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))',
          gap: '4px',
          width: '100%'
        }}>
          {/* 添加字段按钮 */}
          <div style={{ width: '100%' }}>
            <Tooltip title="添加待提取名称，如：姓名、订单号等">
              <div
                onClick={() => setInputVisible(true)}
                style={styles.centeredTag}
              >
                <PlusOutlined />
              </div>
            </Tooltip>
            
          </div>
          {/* 添加清空所有列名按钮 */}
          <div style={{ width: '100%' }}>
            <Tooltip title="清空所有列名">
              <div
                onClick={() => {
                  if(fields.length > 0) {
                    Modal.confirm({
                      title: '确认清空',
                      content: '确定要清空所有列名吗？',
                      okText: '确定',
                      cancelText: '取消',
                      onOk: () => setFields([])
                    });
                  }
                }}
                style={styles.centeredTag}
              >
                <DeleteOutlined />
              </div>
            </Tooltip>
          </div>
          <div style={{ width: '100%' }}>
            <Tooltip title="仅当单张图片中存在多组信息时，才需要勾选此选项。">
              <div
                style={styles.centeredTag}>
                <Checkbox
                  checked={multiLineMode}
                  onChange={(e) => setMultiLineMode(e.target.checked)}
                  style={styles.checkbox}
                >
                  多行
                </Checkbox>
              </div>
            </Tooltip>
          </div>
          {fields.slice(0, maxFields).map((field, index) => (
            <div key={field} style={{ width: '100%' }} onDoubleClick={() => startEditField(index)}>
              <div style={styles.tag}>
                <FieldPopover field={field} />
                <DeleteOutlined 
                  onClick={() => handleDeleteField(field)} 
                  style={{ 
                    cursor: 'pointer',
                    fontSize: fontSizeXS,
                    color: token.colorTextSecondary,
                    flexShrink: 0 // 防止图标被压缩
                  }} 
                />
              </div>
            </div>
          ))}
        </div>
      </NodeCore0>
      
      <div style={{
        display: 'grid',
        marginTop: '10px',
        padding: '0 8px',
        boxSizing: 'border-box',
        gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))',
        gap: '4px',
        width: '100%'
      }}>
        {fields.length>maxFields&&
          fields.slice(maxFields).map((field, index) => (
          <div key={field} style={{ width: '100%', background: token.colorBgContainer }} onDoubleClick={() => startEditField(index + maxFields)}>
            <div style={styles.tag}>
              <FieldPopover field={field} />
              <DeleteOutlined 
                onClick={() => handleDeleteField(field)} 
                style={{ 
                  cursor: 'pointer',
                  fontSize: fontSizeXS,
                  color: token.colorTextSecondary,
                  flexShrink: 0 // 防止图标被压缩
                }} 
              />
            </div>
          </div>
        ))}
      </div>
      {/* 添加字段弹窗 */}
      <Modal
        title="输入待提取名称"
        open={inputVisible}
        onOk={handleAddField}
        onCancel={() => setInputVisible(false)}
        okText="添加"
        cancelText="取消"
        style={{maxWidth: '300px'}}
        width={280}
        centered
        maskClosable={false}
        destroyOnClose
      >
        <Input
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="如：姓名、数量、订单号等"
          onPressEnter={handleAddField}
          autoFocus
          maxLength={20}
        />
      </Modal>
      {/* 修改字段弹窗 */}
      <Modal
        title="修改"
        open={editVisible}
        onOk={handleEditField}
        onCancel={() => setEditVisible(false)}
        okText="确认"
        cancelText="取消"
        style={{maxWidth: '300px'}}
        width={280}
        centered
        maskClosable={false}
        destroyOnClose
      >
        <Input
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="请输入信息名称"
          onPressEnter={handleEditField}
          autoFocus
          maxLength={20}
        />
      </Modal>
    </div>
  );
}

function createStyles(token: any): { tag: CSSProperties; centeredTag: CSSProperties; checkbox: CSSProperties } {
  return {
    tag: {
      display: 'flex',
      alignItems: 'center',
      background: token.colorBgContainer,
      borderRadius: '4px',
      padding: '0 8px',
      border: `1px solid ${token.colorBorderSecondary}`,
      height: '22px',
      boxSizing: 'border-box',
      width: '100%',
      margin: '0',
      color: token.colorText,
      fontSize: token.fontSizeSM*0.75
    },
    centeredTag: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: token.colorBgContainer,
      borderRadius: '4px',
      padding: '0 8px',
      border: `1px solid ${token.colorBorderSecondary}`,
      height: '22px',
      boxSizing: 'border-box',
      width: '100%',
      margin: '0',
      color: token.colorText,
      fontSize: token.fontSizeSM*0.75,
      cursor: 'pointer'
    },
    checkbox: {
      fontSize: token.fontSizeSM*0.75,
      display: 'flex',
      alignItems: 'center',
      lineHeight: 1,
      height: '100%',
      margin: 0,
      whiteSpace: 'nowrap'
    }
  };
}