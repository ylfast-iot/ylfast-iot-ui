const IdUtil = {
  makeString(): string {
    let outString = '';
    const inOptions = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      outString += inOptions.charAt(
        Math.floor(Math.random() * inOptions.length),
      );
    }
    return outString;
  },
};

export { IdUtil };
