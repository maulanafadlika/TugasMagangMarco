const { PurchaseOrderModel } = require("../../../models");
const DateFormatter = require("../../dateTime");


const PurchaseOrder = new PurchaseOrderModel();

async function generatePurchaseOrder(prefix = 'POR') {
    const currentYearMonth = DateFormatter.getCurrentYearMonth();
    // const prefix = 'PRJ';
    console.log('generate po order');
    
    const lastRecord = await PurchaseOrder.findLastPO(prefix, currentYearMonth);
    
    let newId;
    if (lastRecord === null) {
        newId = `${prefix}${currentYearMonth}001`;
    } else {
        const lastId = lastRecord.po_id;
        const lastNumber = parseInt(lastId.slice(-3)) //mengambil 3 digit terakhir
        const newNumber = (lastNumber + 1).toString().padStart(3, '0'); //tambah 1 dan tetap 3 digit

        newId = `${prefix}${currentYearMonth}${newNumber}`
    }

    return newId;
}


async function generateProjectId(prefix = 'PRJ') {
    const currentYearMonth = DateFormatter.getCurrentYearMonth();
    // const prefix = 'PRJ';

    const lastRecord = await PurchaseOrder.findLastProjectId(prefix, currentYearMonth);
    
    let newId;
    if (lastRecord === null) {
        newId = `${prefix}${currentYearMonth}001`;
    } else {
        const lastId = lastRecord.id;
        const lastNumber = parseInt(lastId.slice(-3)) //mengambil 3 digit terakhir
        const newNumber = (lastNumber + 1).toString().padStart(3, '0'); //tambah 1 dan tetap 3 digit

        newId = `${prefix}${currentYearMonth}${newNumber}`
    }

    return newId;
}

module.exports = {
    generateProjectId,
    generatePurchaseOrder
}