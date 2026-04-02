import { Flex } from "antd"
import { useTheme } from "../common/theme/themeContext"

/**
 * 加载组件参数
 * @typedef {Object} Argv
 * @property {boolean} isLoading - 是否加载中
 * @property {React.ReactNode} children - 子组件内容
 */
type Argv={
  isLoading:boolean,
  transparent?:boolean
  children:React.ReactNode
}

/**
 * 自定义加载组件
 * @param {Argv} props - 组件参数
 * @returns {JSX.Element} 加载组件
 */
export default function LoadingCus({isLoading,transparent=false,children}:Argv){
  const { theme } = useTheme();
  
  return(
    <Flex 
      id="loadingCus" gap={"small"} vertical 
      style={{
        width:"100%",
        height:"100%",
        // overflow:"hidden",
        boxSizing:"border-box",
        backgroundColor: transparent ? 'transparent' : ( theme === 'dark' ? '#121212' : '#f0f0f0')
        // backgroundColor: theme === 'dark' ? '#121212' : '#f0f0f0'
      }} 
      justify="center" 
      align="center"
    >
      {
        isLoading&&
        <div style={{ color: theme === 'dark' ? '#e1e1e1' : 'inherit' }}>加载中...</div>
      }
      { !isLoading&&
        children
      }
    </Flex>
  )
}