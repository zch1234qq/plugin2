import { Button, Flex } from "antd";
import lineStorage from "../common/lineStorage";
import { useAtom } from "jotai";
import { stateDebug } from "../common/store/store";

/**
 * 数据库操作按钮组件
 * 提供查看最新数据和删除数据功能
 */
interface DbActionsProps {
  id: string;           // 节点ID
  nodeType: string;     // 节点类型名称
  dbKey?: string;       // 数据库键名，默认为"value"
}

export const ComDbActions: React.FC<DbActionsProps> = ({ id, nodeType, dbKey = "value" }) => {
  const [, setDebug] = useAtom(stateDebug);

  /**
   * 查看最新一条数据
   */
  const viewLatestData = async () => {
    let latestData="";
    try {
      latestData = await lineStorage.readLatestLine(dbKey)||"";
      if (!latestData) {
        latestData="记忆为空";
      }
    } catch (error) {
      latestData="读取失败";
      console.error("读取失败:", error);
    }
    setDebug((prev) => ({
      ...prev,
      data:latestData,
      nodeType:nodeType,
    }))
  };

  /**
   * 删除数据库中的所有数据
   */
  const deleteAllData = () => {
    lineStorage.removeLatestLine(dbKey)
      .then((success) => {
        if (success) {
          window.messageApi.success("删除成功");
        } else {
          window.messageApi.error("删除失败");
        }
      })
      .catch((error) => {
        window.messageApi.error(`删除失败: ${error}`);
      });
  };

  return (
    <Flex>
      <Button style={{width:"50%"}} onClick={viewLatestData}>
        查看
      </Button>
      <Button danger style={{width:"50%"}} type="primary" onClick={deleteAllData}>
        删除
      </Button>
    </Flex>
  );
};

export default ComDbActions; 