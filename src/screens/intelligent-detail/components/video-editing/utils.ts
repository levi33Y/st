// 生成唯一ID
export const generateId = () => {
  return `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// 格式化时间
export const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);

  const secs = Math.floor(seconds % 60);

  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};
