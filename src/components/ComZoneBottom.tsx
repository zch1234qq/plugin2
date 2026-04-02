import { AutoComplete, Button, Flex, Input } from "antd";
import ComTipAI from "./ComTipAI";
import { EnumNodeType, RecordGroupNameOfNode, RecordNodeColor, RecordNodeLabel, RecordNodeTextColor } from "../common/types/types";
import { useEffect, useState, useRef } from "react";
import utilsNode from "../common/utilsNode";

export default function ComZoneBottom( {addNode}:{addNode:(type:EnumNodeType,manual:boolean)=>void} ){
  const [NodeNameToAdd,setNodeNameToAdd]=useState("")
  const [suggestions, setSuggestions] = useState<Array<{value: string, label: string, key?: string, nodeType?: EnumNodeType}>>([])
  const [activeIndex, setActiveIndex] = useState(-1); // 跟踪当前活动选项的索引
  const [enterHandled, setEnterHandled] = useState(false); // 跟踪回车键是否已处理
  const lastAddTimeRef = useRef<number>(0); // 跟踪最后一次添加节点的时间
  const keyPressedRef = useRef(false); // 简单的按键状态跟踪
  const refNodeType = useRef<EnumNodeType | undefined>(undefined);

  // 添加节点的包装函数，防止快速重复添加
  const safeAddNode = (_name: string, type: EnumNodeType) => {
    if(type==undefined){
      window.messageApi.error("请输入正确的节点名");
      return;
    }
    const now = Date.now();
    // 如果距离上次添加不足300ms，则忽略
    if (now - lastAddTimeRef.current < 300) {
      return;
    }
    
    // 更新最后添加时间
    lastAddTimeRef.current = now;
    addNode(type,false);
  };


  useEffect(()=>{
  },[NodeNameToAdd])

  // 用于追踪搜索状态，确保每次都是全新搜索
  const resetSearch = () => {
    setNodeNameToAdd("");
    setSuggestions([]);
    setActiveIndex(-1); // 重置活动索引
  };

  // 处理键盘上下键
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 如果按键已经处于按下状态，不重复触发
    if (keyPressedRef.current) return;
    // 设置按键状态为按下
    keyPressedRef.current = true;
    
    // 回车键重复处理保护
    if (e.key === 'Enter' && enterHandled) {
      e.preventDefault();
      e.stopPropagation(); // 阻止事件冒泡
      keyPressedRef.current = false;
      return;
    }

    // 上下键处理
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); // 防止光标移动
      if (suggestions.length === 0) {
        return;
      }
      
      // 计算新的活动索引
      let newIndex = -1;
      if (e.key === 'ArrowDown') {
        newIndex = activeIndex < suggestions.length - 1 ? activeIndex + 1 : 0;
      } else { // ArrowUp
        newIndex = activeIndex > 0 ? activeIndex - 1 : suggestions.length - 1;
      }
      
      // 更新活动索引
      setActiveIndex(newIndex);
      
      // 更新输入框的值为当前选中项
      const selectedOption = suggestions[newIndex];
      if (selectedOption) {
        const value = selectedOption.value as string;
        
        // 如果是包含节点类型的值，提取实际标签
        if (typeof value === 'string' && value.includes('|')) {
          refNodeType.current = selectedOption.nodeType as EnumNodeType;
        } else {
          refNodeType.current = selectedOption.nodeType;
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault(); // 防止表单提交
      e.stopPropagation(); // 阻止事件冒泡
      
      // 标记回车已处理
      setEnterHandled(true);
      
      // 使用活动选项；如果有候选但未选中，默认使用首项
      if (suggestions.length > 0) {
        const selectedOption = activeIndex >= 0 ? suggestions[activeIndex] : suggestions[0];
        if (selectedOption) {
          // 处理可能包含节点类型信息的值
          let actualValue = selectedOption.value as string;
          let selectedType: EnumNodeType | undefined = selectedOption.nodeType;
          
          // 检查是否是格式为 "label|type" 的值
          if (typeof actualValue === 'string' && actualValue.includes('|')) {
            const parts = actualValue.split('|');
            actualValue = parts[0];
            selectedType = parts[1] as EnumNodeType;
          }

          // 普通项（不含|）依然需要确保拿到节点类型
          if (!selectedType) {
            selectedType = utilsNode.convertLabelToNodeType(actualValue) as EnumNodeType;
          }
          
          // 设置输入框的值
          setNodeNameToAdd(actualValue);
          
          // 调用添加节点函数
          safeAddNode(actualValue, selectedType as EnumNodeType);
        }
      } else if (NodeNameToAdd) {
        // 没有活动选项时使用当前输入
        safeAddNode(NodeNameToAdd, utilsNode.convertLabelToNodeType(NodeNameToAdd) as EnumNodeType);
      }
      
      // 重置搜索状态
      setTimeout(() => {
        resetSearch();
      }, 100);
    }
  };

  useEffect(() => {
    // 输入变化时重置回车处理状态
    setEnterHandled(false);
  }, [NodeNameToAdd]);

  useEffect(() => {
    // 当输入变化时重置活动索引
    setActiveIndex(-1);
    
    // 每次输入变化时先清空之前的建议
    setSuggestions([]);
    
    // 在effect内部定义过滤函数，避免闭包问题
    function filterNodeLabels(input: string) {
      if (!input) return [];
      // 确保输入字符串有效
      const searchText = input.trim().toLowerCase(); // 转为小写以实现大小写不敏感匹配
      if (!searchText) return [];
      
      // 用于跟踪已添加的标签，避免重复
      const addedLabels = new Set<string>();
      
      // 清除之前的搜索结果
      const newFiltered = Object.entries(RecordNodeLabel)
        .filter(([type, label]) => {
          // 规范化字符串进行比较（转换为小写）
          const normalizedLabel = label.trim().toLowerCase();
          
          // 增强匹配 - 完全匹配、前缀匹配和包含匹配
          const isExactMatch = normalizedLabel === searchText;
          const isPrefixMatch = normalizedLabel.startsWith(searchText);
          const isIncludeMatch = normalizedLabel.includes(searchText);
          const isMatch = isExactMatch || isPrefixMatch || isIncludeMatch;
          
          if (isMatch) {
            let matchType = "未知匹配";
            if (isExactMatch) matchType = "完全匹配";
            else if (isPrefixMatch) matchType = "前缀匹配";
            else if (isIncludeMatch) matchType = "包含匹配";
          }
          return isMatch;
        })
        .map(([type, label]) => {
          // 生成唯一的键，包含节点类型和标签
          const uniqueKey = `${type}-${label}`;
          
          return {
            value: label,
            label: `${label}(${RecordGroupNameOfNode[type as EnumNodeType]})`,
            key: uniqueKey, // 添加唯一键
            nodeType: type as EnumNodeType // 添加节点类型信息
          };
        })
        // 确保每个标签只显示一次，添加标识符区分同名标签
        .reduce((acc, current) => {
          // 如果是同名标签，添加节点类型作为区分
          if (addedLabels.has(current.value)) {
            // 将nodeType添加到value中，方便后续处理
            current.value = `${current.value}|${current.nodeType}`;
          } else {
            addedLabels.add(current.value);
          }
          acc.push(current);
          return acc;
        }, [] as Array<{value: string, label: string, key: string, nodeType: EnumNodeType}>);
      return newFiltered;
    }
    
    if (NodeNameToAdd) {
      setSuggestions(filterNodeLabels(NodeNameToAdd));
    } else {
      setSuggestions([]);
    }
  }, [NodeNameToAdd]);

  useEffect(() => {
    // 添加全局键盘事件监听
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 如果按键已经处于按下状态，不重复触发
      if (keyPressedRef.current) return;
      // 设置按键状态为按下
      keyPressedRef.current = true;
      
      // 处理方向键
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        // 如果没有建议列表，不处理
        if (suggestions.length === 0) {
          keyPressedRef.current = false;
          return;
        }
        
        // 阻止默认行为
        e.preventDefault();
        
        // 计算新的活动索引
        let newIndex = -1;
        if (e.key === 'ArrowDown') {
          newIndex = activeIndex < suggestions.length - 1 ? activeIndex + 1 : 0;
        } else { // ArrowUp
          newIndex = activeIndex > 0 ? activeIndex - 1 : suggestions.length - 1;
        }
        
        // 更新活动索引
        setActiveIndex(newIndex);
        // 更新输入框的值为当前选中项
        const selectedOption = suggestions[newIndex];
        if (selectedOption) {
          const value = selectedOption.value as string;
          if (typeof value === 'string' && value.includes('|')) {
            const actualLabel = value.split('|')[0];
            setNodeNameToAdd(actualLabel);
          } else {
            setNodeNameToAdd(value);
          }
        }
      }
    };
    
    // 键盘抬起事件处理
    const handleGlobalKeyUp = () => {
      // 重置按键状态
      keyPressedRef.current = false;
    };
    // 添加全局键盘事件监听
    // document.addEventListener('keydown', handleGlobalKeyDown);
    // document.addEventListener('keyup', handleGlobalKeyUp);
    // 组件卸载时移除监听
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
      document.removeEventListener('keyup', handleGlobalKeyUp);
    };
  }, [activeIndex, suggestions]); // 依赖于活动索引和建议列表

  return(
    <Flex vertical style={{position:"absolute",bottom:0,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",zIndex:500,left:0,width:"100%",height:"auto",pointerEvents:"none"}}>
      <AutoComplete
        value={NodeNameToAdd}
        options={suggestions}
        defaultActiveFirstOption={false} // 禁用默认选中第一个选项
        backfill={false} // 禁用自动填充
        autoFocus={true} // 自动获取焦点
        open={suggestions.length > 0} // 只在有建议时才显示下拉框
        onInputKeyDown={(e) => {
          // 直接在这里处理键盘事件，确保能捕获到
          handleKeyDown(e as React.KeyboardEvent<HTMLInputElement>);
          // 防止默认行为，确保我们可以完全控制
          if (e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onKeyDown={(e) => {
          // 防止默认行为，确保我们可以完全控制
          if (e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onChange={(value) => {
          setNodeNameToAdd(value);
          setActiveIndex(-1);
        }}
        onSelect={(value) => {
          let actualValue = value as string;
          let selectedType: EnumNodeType=utilsNode.convertLabelToNodeType(actualValue) as EnumNodeType;
          if (typeof actualValue === 'string' && actualValue.includes('|')) {
            const parts = actualValue.split('|');
            actualValue = parts[0];
            selectedType = parts[1] as EnumNodeType;
          }
          setNodeNameToAdd(actualValue);
          safeAddNode(actualValue, selectedType as EnumNodeType); // 传递节点类型信息
          setTimeout(() => {
            resetSearch();
          }, 100);
        }}
        onBlur={() => {
          // 失去焦点时清除搜索状态
          setTimeout(() => resetSearch(), 200);
        }}
        optionRender={(option, { index }) => {
          // 处理可能包含节点类型信息的值
          let value = option.value as string;
          let nodeType: EnumNodeType | undefined;
          
          // 检查是否是格式为 "label|type" 的值
          if (typeof value === 'string' && value.includes('|')) {
            const parts = value.split('|');
            value = parts[0];
            nodeType = parts[1] as EnumNodeType;
          } else {
            nodeType = utilsNode.convertLabelToNodeType(value as string);
          }
          
          const bgColor = nodeType ? RecordNodeColor[nodeType as EnumNodeType] : "white";
          const textColor = nodeType ? RecordNodeTextColor[nodeType as EnumNodeType] : "black";
          
          // 是否是当前活动项
          const isActive = index === activeIndex;
          
          // 显示更详细的信息来区分同名标签
          return (
            <div 
              style={{ 
                backgroundColor: bgColor, 
                padding: '4px 8px', 
                color: textColor,
                border: isActive ? '2px solid #1890ff' : 'none', // 高亮边框
                borderRadius: isActive ? '4px' : '0'
              }}
            >
              <span style={{ color: textColor }}>{option.label}</span>
              {typeof value === 'string' && value.includes('|') && <span style={{ fontSize: 'small', marginLeft: '4px' }}>(同名节点)</span>}
            </div>
          );
        }}
        style={{
          zIndex:2000,
          width:"30%",
          minWidth:"200px",
          height:"auto",
          display:"flex",
          flexDirection:"row",
          alignItems:"center",
          // backgroundColor: RecordNodeColor[utilsNode.convertLabelToNodeType(NodeNameToAdd) as EnumNodeType],
          pointerEvents:"auto" // 确保AutoComplete组件可以接收鼠标事件
        }}
      >
        <Input 
          placeholder="输入节点名"
          onKeyUp={(e) => {
            // 重置按键状态
            keyPressedRef.current = false;
            // 完全禁用onKeyUp中的回车处理，所有回车处理都在handleKeyDown中完成
            if (e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          addonAfter={
            <Button type="primary" onClick={() => {
              if (NodeNameToAdd) {
                // 对于直接输入的情况，我们不知道具体是哪个节点类型，所以使用默认行为
                safeAddNode(NodeNameToAdd, utilsNode.convertLabelToNodeType(NodeNameToAdd) as EnumNodeType);
                // safeAddNode(NodeNameToAdd, 'ocr' as EnumNodeType);
                // 添加节点后清空输入框
                setTimeout(() => {
                  resetSearch();
                }, 100);
              }
            }}>添加</Button>
          }
        />
      </AutoComplete>
      <ComTipAI style={{pointerEvents:"auto"}}/>
    </Flex>
  )
}