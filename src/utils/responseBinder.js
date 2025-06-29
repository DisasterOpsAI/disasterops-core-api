const responseBinder = (res, func) => {
  const originalJson = res.json.bind(res);
  res.json = async (data) => {
    const responseData = await func(data);
    return originalJson(responseData);
  };
  return res;
};
export default responseBinder;
