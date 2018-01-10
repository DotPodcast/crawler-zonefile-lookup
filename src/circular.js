const from = (arr) => {
  // TODO check to make sure it's an array
  let idx = 0;
  const len = arr.length;

  return {
    next: () => {
      const val = arr[idx];

      if (idx === len - 1) {
        idx = 0;
      } else {
        idx += 1;
      }

      return val;
    },
  };
};

export default { from };
