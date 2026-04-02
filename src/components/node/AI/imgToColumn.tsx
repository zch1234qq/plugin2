import { useRef, useState, useEffect } from "react";
import { EnumNodeType, NodeData, RecordNodeLabel, Res } from "../../../common/types/types";
import aiShellService from "../../../common/service/aiShellService";
import '../style.css'
import { useAtom } from "jotai";
import { stateDebug } from "../../../common/store/store";
import { Input, Modal, Tag, Tooltip, theme as antdTheme } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import NodeCore0 from "../_node0";
import { CSSProperties } from "react";
import { updateResData } from "../../../common/utils";
import utilsImg from "../../../common/utilsImg";
/**
 * 图片转表格列节点组件
 * 从图片中提取数据并转换为CSV格式的一列
 * @param {Object} props - 组件属性
 * @param {string} props.id - 节点ID
 * @param {NodeData} props.data - 节点数据
 * @returns {JSX.Element} 图片转表格列节点组件
 */
export default function ImgToColumn({id, data}: {id: string, data: NodeData}) {
  const { token } = antdTheme.useToken();
  const styles = createStyles(token);
  // 提示词
  const [v0, _] = useState("");
  const v0Ref = useRef(v0);
  
  // 字段列表
  const [fields, setFields] = useState<string[]>([]);
  const fieldsRef = useRef<string[]>([]);
  
  // 新字段输入
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  // 调试状态
  const [, setDebug] = useAtom(stateDebug);

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
  }, []);

  // 保存字段列表到data
  useEffect(() => {
    data.values[1] = JSON.stringify(fields);
    fieldsRef.current = fields;
  }, [fields]);
  
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

  /**
   * 处理图像并提取数据
   * @param {Res} input - 输入图像
   * @returns {Promise<Res>} 处理结果，CSV格式的一列或多列
   */
  async function run(input: Res): Promise<Res> {
    if (!input.success) {
      return input;
    }
    
    if (!input.msg.startsWith('data:image')&&!input.msg.startsWith('http')) {
      return updateResData(input,{
        success: false,
        msg: "输入必须是图片"
      });
    }else if(input.msg.startsWith('http')){
      //将网络图片转为 dataurl图片
      try {
        input.msg=await utilsImg.processHttpImageWithSampling(input.msg, 0.9)
      } catch (error) {
        console.error('网络图片处理失败:', error);
        // 出错时尝试直接使用URL
      }
    }
    if(fieldsRef.current.length===0){
      return updateResData(input,{
        success: false,
        msg: "请至少添加一个名称"
      });
    }
    
    // 显示处理状态
    setDebug({
      show: true,
      data: `正在从图片中提取数据...`,
      loading: true,
      nodeId: id,
      msgtype:"text",
      nodeType: RecordNodeLabel[EnumNodeType.ImgToColumn]
    });
    
    try {
      // 构建提示词
      let prompt = v0Ref.current || "我有一张图片，请帮我从中提取数据，并转换为CSV格式的列数据。";
      if (fieldsRef.current.length > 0) {
        prompt += "\n需要提取的字段是：" + fieldsRef.current.join("，");
        prompt += "\n请提取所有信息并使用回车分隔，不要包含表头，不要有其他解释。";
      }
      
      // 调用服务器API处理图像
      const result = await aiShellService.GptImg(
        prompt,
        input.msg,
        prompt,
        data.sharer
      );
      
      if (!result.data.success) {
        return updateResData(input,{
          success: false,
          msg: result.data.message || "处理失败"
        });
      }
      
      // 处理返回的数据，确保是CSV格式
      let csvData = result.data.msg.trim();
      // 移除可能存在的代码块标记
      csvData = csvData.replace(/```csv\s*/g, "").replace(/```\s*$/g, "");
      
      setDebug({
        show: true,
        data: `处理完成`,
        loading: false,
        msgtype:"text",
        nodeId: id,
        nodeType: RecordNodeLabel[EnumNodeType.ImgToColumn]
      });
      
      return updateResData(input,{
        success: true,
        msg: csvData,   
        headers: ""
      });
    } catch (error: any) {
      setDebug({
        show: true,
        data: `处理失败: ${error.message}`,
        loading: false,
        msgtype:"text",
        nodeId: id,
        nodeType: RecordNodeLabel[EnumNodeType.ImgToColumn]
      });
      
      return updateResData(input,{
        success: false,
        msg: error instanceof Error ? error.message : "处理失败"
      });
    }
  }

  return (
    <div className="img-to-column-container" style={{ width: '100%' }}>
      <NodeCore0
        root={false}
        handles={[1, 1]}
        colors={[0, 1]} // 输入为红色（图片），输出为默认色（文本）
        run0={run}
        id={id}
        data={data}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))',
          gap: '4px',
          width: '100%'
        }}>
          {/* 添加字段按钮 */}
          <div style={{ width: '100%' }}>
            <Tooltip title="添加行名">
              <Tag 
                onClick={() => setInputVisible(true)}
                style={{ 
                  background: token.colorBgContainer, 
                  borderStyle: 'dashed',
                  cursor: 'pointer',
                  margin: '0',
                  width: '100%',
                  boxSizing: 'border-box',
                  textAlign: 'center'
                }}
              >
                <PlusOutlined />
              </Tag>
            </Tooltip>
            
          </div>
          {/* 添加清空所有行名按钮 */}
          <div style={{ width: '100%' }}>
            <Tooltip title="清空所有行名">
              <Tag 
                onClick={() => {
                  if(fields.length > 0) {
                    Modal.confirm({
                      title: '确认清空',
                      content: '确定要清空所有行名吗？',
                      okText: '确定',
                      cancelText: '取消',
                      onOk: () => setFields([])
                    });
                  }
                }}
                style={{ 
                  background: token.colorBgContainer, 
                  borderStyle: 'dashed',
                  cursor: 'pointer',
                  margin: '0',
                  width: '100%',
                  boxSizing: 'border-box',
                  textAlign: 'center',
                  color: fields.length > 0 ? token.colorError : token.colorTextDisabled
                }}
              >
                <DeleteOutlined />
              </Tag>
            </Tooltip>
          </div>
          {fields.slice(0, 8).map((field, _) => (
            <div key={field} style={{ width: '100%' }}>
              <div style={styles.tag}>
                <span style={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0 // 确保文本可以正确收缩
                }}>
                  {field}
                </span>
                <DeleteOutlined 
                  onClick={() => handleDeleteField(field)} 
                  style={{ 
                    cursor: 'pointer',
                    fontSize: '10px',
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
        {fields.length>8&&
          fields.slice(8).map((field, _) => (
          <div key={field} style={{ width: '100%', background: token.colorBgContainer }}>
            <div style={styles.tag}>
              <span style={{
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0 // 确保文本可以正确收缩
              }}>
                {field}
              </span>
              <DeleteOutlined 
                onClick={() => handleDeleteField(field)} 
                style={{ 
                  cursor: 'pointer',
                  fontSize: '10px',
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
        title="添加行名"
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
          placeholder="请输入行名"
          onPressEnter={handleAddField}
          autoFocus
          maxLength={20}
        />
      </Modal>
    </div>
  );
}

function createStyles(token: any): { tag: CSSProperties } {
  return {
    tag: {
      display: 'flex',
      alignItems: 'center',
      background: token.colorFillAlter,
      borderRadius: '4px',
      padding: '0 8px',
      border: `1px solid ${token.colorBorderSecondary}`,
      height: '22px',
      boxSizing: 'border-box',
      width: '100%',
      margin: '0',
      color: token.colorText,
      fontSize: token.fontSizeSM
    }
  };
}