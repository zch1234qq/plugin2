import { NodeData, Res } from "../../../common/types/types";
import '../style.css';
import { Checkbox, Input, Modal, Tag, Tooltip, theme as antdTheme } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import NodeCore0 from "../_node0";
import { useState, useRef, useEffect, CSSProperties } from "react";
import utils, { updateResData } from "../../../common/utils";
import FieldPopover from "../../FieldPopover";

/**
 * 添加表头节点组件
 * 在输入文本的起始处添加一行表头
 * @param {Object} props - 组件属性
 * @param {string} props.id - 节点ID
 * @param {NodeData} props.data - 节点数据
 * @returns {JSX.Element} 添加表头节点组件
 */
const maxFields = 7;
export default function AddHeader({ id, data }: { id: string; data: NodeData }) {
  const { token } = antdTheme.useToken();
  const styles = createStyles(token);
  // 字段列表（列名）
  const [fields, setFields] = useState<string[]>([]);
  const fieldsRef = useRef<string[]>([]);

  // 自动表头：使用上游 Res.headers 作为 CSV 第一行表头
  const [autoHeader, setAutoHeader] = useState<boolean>(data.values[1]==="1"||data.values[1]==="true");
  const autoHeaderRef = useRef<boolean>(autoHeader);
  const manualDisabled = autoHeader;

  // 新字段输入
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // 修改字段
  const [editVisible, setEditVisible] = useState(false);
  const [editIndex, setEditIndex] = useState(-1);

  // 初始化数据
  useEffect(() => {
    // 初始化字段列表
    if (data.values[0]) {
      try {
        const savedFields = JSON.parse(data.values[0]);
        if (Array.isArray(savedFields)) {
          setFields(savedFields);
          fieldsRef.current = savedFields;
        }
      } catch (e) {
        console.error("解析字段数据失败", e);
        // 如果解析失败，尝试兼容旧格式的单一表头文本
        try {
          const savedHeader = data.values[0];
          if (typeof savedHeader === 'string' && savedHeader.trim()) {
            const headerFields = savedHeader.split(/[,，]/).map(field => field.trim()).filter(field => field);
            setFields(headerFields);
            fieldsRef.current = headerFields;
          }
        } catch (e) {
          console.error("兼容旧格式失败", e);
        }
      }
    }}, []);

  // 初始化自动表头开关
  useEffect(() => {
    const v = data.values[1];
    const enabled = v === "1" || v === "true";
    setAutoHeader(enabled);
    autoHeaderRef.current = enabled;
  }, []);

  // 保存字段列表到data
  useEffect(() => {
    data.values[0] = JSON.stringify(fields);
    fieldsRef.current = fields;
  }, [fields]);

  useEffect(() => {
    data.values[1] = autoHeader ? "1" : "0";
    autoHeaderRef.current = autoHeader;
    // 切换到自动表头模式时，关闭弹窗，避免交互状态卡住
    if (autoHeader) {
      setInputVisible(false);
      setEditVisible(false);
      setInputValue("");
      setEditIndex(-1);
    }
  }, [autoHeader]);

  // 添加字段
  const handleAddField = () => {
    if (inputValue.trim() && fields.indexOf(inputValue.trim()) === -1) {
      const newFields = [...fields, inputValue.trim()];
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
    if (inputValue.trim() && editIndex >= 0) {
      const newFields = [...fields];
      // 检查修改后的值是否与其他字段重复
      const isDuplicate = newFields.some((field, index) => 
        index !== editIndex && field === inputValue.trim()
      );
      if (!isDuplicate) {
        newFields[editIndex] = inputValue.trim();
        setFields(newFields);
      }
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

  // 清空所有字段
  const handleClearAllFields = () => {
    Modal.confirm({
      title: '确认清空',
      content: '确定要清空所有列名吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => setFields([])
    });
  };

  /**
   * 处理文本并添加表头
   * @param {Res} input - 输入文本
   * @returns {Promise<Res>} 处理结果，在文本开头添加表头后的文本
   */
  async function run(input: Res): Promise<Res> {
    if (!input.success) {
      return input;
    }
    try {
      // 获取当前输入的文本内容
      const inputText = input.msg || "";

      // 勾选“自动表头”时，优先使用上游的 headers
      let headers = "";
      if (autoHeaderRef.current) {
        headers = (input.headers || "").trim();
      }
      // 自动表头不可用时，回退到手动字段
      if (!headers) {
        if (fieldsRef.current.length === 0) {
          return input;
        }
        headers = fieldsRef.current.join(',');
      }
      
      // 在文本开头添加表头
      let resultText = headers;
      
      // 如果输入文本不为空，则在表头后添加换行符和原始文本
      if (inputText.trim()) {
        resultText += "\n" + inputText;
      }

      // 返回处理后的结果
      return updateResData(input, {
        success: true,
        msgtypeRe:"excel",
        msg: resultText,
        headers: headers
      });
    } catch (error: any) {
      utils.log(`添加表头节点 处理出错: ${error}`);
      return updateResData(input, {
        success: false,
        msg: error instanceof Error ? error.message : "处理失败"
      });
    }
  }

  return (
    <div className="add-header-container" style={{ width: '100%' }}>
      <NodeCore0
        root={false}
        handles={[1, 1]}
        colors={[0, 0]} // 输入和输出均为默认色（文本）
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
          <div style={{ width: '100%' }}>
            <Tooltip title="自动添加表头(要求上游存在图片转行或文字转行等节点)">
              <Tag
                style={{
                  background: token.colorBgContainer,
                  borderStyle: 'dashed',
                  cursor: 'pointer',
                  margin: '0',
                  width: '100%',
                  height: '22px',
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px'
                }}
              >
                <Checkbox
                  checked={autoHeader}
                  onChange={(e) => setAutoHeader(e.target.checked)}
                  style={{ marginInlineStart: 0 }}
                >
                  自动
                </Checkbox>
              </Tag>
            </Tooltip>
          </div>
          {/* 添加字段按钮 */}
          <div style={{ width: '100%' }}>
            <Tooltip title={manualDisabled ? "自动表头模式下不可手动添加列名" : "添加列名，如：姓名、年龄、订单号等"}>
              <Tag
                onClick={() => {
                  if (manualDisabled) return;
                  setInputVisible(true);
                }}
                style={{
                  background: token.colorBgContainer,
                  borderStyle: 'dashed',
                  cursor: manualDisabled ? 'not-allowed' : 'pointer',
                  margin: '0',
                  width: '100%',
                  boxSizing: 'border-box',
                  textAlign: 'center',
                  opacity: manualDisabled ? 0.5 : 1,
                  pointerEvents: manualDisabled ? 'none' : 'auto'
                }}
              >
                <PlusOutlined />
              </Tag>
            </Tooltip>
          </div>
          {/* 清空所有列名按钮 */}
          <div style={{ width: '100%' }}>
            <Tooltip title={manualDisabled ? "自动表头模式下不可清空列名" : "清空所有列名"}>
              <Tag
                onClick={() => {
                  if (manualDisabled) return;
                  handleClearAllFields();
                }}
                style={{
                  background: token.colorBgContainer,
                  borderStyle: 'dashed',
                  cursor: manualDisabled ? 'not-allowed' : 'pointer',
                  margin: '0',
                  width: '100%',
                  boxSizing: 'border-box',
                  textAlign: 'center',
                  // color: fields.length > 0 ? token.colorError : token.colorTextDisabled,
                  opacity: manualDisabled ? 0.5 : 1,
                  pointerEvents: manualDisabled ? 'none' : 'auto'
                }}
              >
                <DeleteOutlined />
              </Tag>
            </Tooltip>
          </div>
          {fields.slice(0, maxFields).map((field, index) => (
            <div
              key={field}
              style={{
                width: '100%',
                opacity: manualDisabled ? 0.55 : 1,
                pointerEvents: manualDisabled ? 'none' : 'auto'
              }}
              onDoubleClick={() => {
                if (manualDisabled) return;
                startEditField(index);
              }}
            >
              <div style={styles.tag}>
                <FieldPopover field={field} />
                <DeleteOutlined
                  onClick={() => {
                    if (manualDisabled) return;
                    handleDeleteField(field);
                  }}
                  style={{
                    cursor: manualDisabled ? 'not-allowed' : 'pointer',
                    fontSize: '10px',
                    color: token.colorTextSecondary,
                    flexShrink: 0
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
        {fields.length > maxFields &&
          fields.slice(maxFields).map((field, index) => (
            <div
              key={field}
              style={{
                width: '100%',
                background: token.colorBgContainer,
                opacity: manualDisabled ? 0.55 : 1,
                pointerEvents: manualDisabled ? 'none' : 'auto'
              }}
              onDoubleClick={() => {
                if (manualDisabled) return;
                startEditField(index + maxFields);
              }}
            >
              <div style={styles.tag}>
                <FieldPopover field={field} />
                <DeleteOutlined
                  onClick={() => {
                    if (manualDisabled) return;
                    handleDeleteField(field);
                  }}
                  style={{
                    cursor: manualDisabled ? 'not-allowed' : 'pointer',
                    fontSize: '10px',
                    color: token.colorTextSecondary,
                    flexShrink: 0
                  }}
                />
              </div>
            </div>
          ))}
      </div>
          
      {/* 添加字段弹窗 */}
      <Modal
        title="输入列名"
        open={inputVisible}
        onOk={handleAddField}
        onCancel={() => setInputVisible(false)}
        okText="添加"
        cancelText="取消"
        style={{ maxWidth: '300px' }}
        width={280}
        centered
        maskClosable={false}
        destroyOnClose
      >
        <Input
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="如：姓名、年龄、订单号等"
          onPressEnter={handleAddField}
          autoFocus
          maxLength={20}
        />
      </Modal>
      {/* 修改字段弹窗 */}
      <Modal
        title="修改列名"
        open={editVisible}
        onOk={handleEditField}
        onCancel={() => setEditVisible(false)}
        okText="确认"
        cancelText="取消"
        style={{ maxWidth: '300px' }}
        width={280}
        centered
        maskClosable={false}
        destroyOnClose
      >
        <Input
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="请输入列名"
          onPressEnter={handleEditField}
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
      background: token.colorBgContainer,
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