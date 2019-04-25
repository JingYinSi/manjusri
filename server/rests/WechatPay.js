const entity = require('../biz/Transactions'),
    __ = require('underscore'),
    wx = require('../weixin').weixinService,
    logger = require('@finelets/hyper-rest/app/Logger')

function prepay(req) {
    const virtueType = require('../biz/VirtueTypes'),
        subject = req.params.id,
        lord = req.user.id,
        openId = req.session.user.openid
    let subjectName, virtue

    return virtueType.findById(subject)
        .then(doc => {
            subjectName = doc.name
            /* req.body: amount, price, num, giving */
            return entity.create({
                ...req.body,
                subject,
                lord
            })
        })
        .then(doc => {
            virtue = doc
            // TODO: in dev mode
            return {openId, virtueId: doc.id, subject: subjectName, amount: doc.amount}
            /* return wx.prepay(openId, doc.id, subjectName, doc.amount)
                .catch(() => {
                    logger.error('Weixin prepay failed !')
                }) */
        })
        .then(payData => {
            virtue.payData = payData
            return virtue
        })
}

module.exports = {
    url: '/jingyin/manjusri/subject/:id/virtues',
    transitions: {
        'VirtueType': {
            id: 'params.id'
        }
    },
    rests: [{
            type: 'create',
            target: 'Virtue',
            handler: prepay
        }
    ]
}