let actionChain = [];

const set = (chain) => {
    actionChain = chain;
};
const get = () => actionChain;

module.exports = {
    set,
    get,
}