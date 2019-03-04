const axios = require('axios');
const __ = require('underscore')
let {
    ExportToCsv
} = require('export-to-csv')

const options = {
    filename: 'jys.csv',
    fieldSeparator: ',',
    quoteStrings: '"',
    decimalSeparator: '.',
    showLabels: true,
    showTitle: true,
    title: '静音寺受捐金额汇总表',
    useTextFile: false,
    useBom: true,
    useKeysAsHeaders: true,
    // headers: ['Column 1', 'Column 2', etc...] <-- Won't work with useKeysAsHeaders present!
}
const csvExporter = new ExportToCsv(options);
return axios.get('http://www.jingyintemple.top/jingyin/rests/manjusri/statistics?type=topN')
    .then(res => {
        let data = __.map(res.data.details, obj => {
            let item = {
                ...obj.lord,
                count: obj.count,
                sum: obj.sum
            }
            return item
        })
        let csv = csvExporter.generateCsv(data, true);
        const fs = require('fs')

        fs.writeFile('C:/Users/clx/Desktop/jys.csv', csv, (err) => {
            if (err) {
                console.error(err)
                return
            }
            console.log('成功');
        })
    })
    .catch(error => {
        console.log(error);
    });