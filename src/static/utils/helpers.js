export function createActionTypes(name){
    const baseName = name.toUpperCase();
    const actionTypes = ['request', 'success', 'failure', 'complete'];

    return actionTypes.map((type) => baseName + '_' + type);
}
