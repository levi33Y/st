export const waitAnimationFrame = (): Promise<void> => {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
};
