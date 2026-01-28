function createTag(name, address, type = "bool") {
    return {
        name,
        address,
        type,
        value: null
    };
}

module.exports = { createTag };
