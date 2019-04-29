function sessUser(req, res) {
    if(!req.session || !req.session.user) return res.status(400).end()
    return res.json(req.session.user)
}

module.exports = {
    url: '/jingyin/rests/manjusri/wx/user',
    rests: [{
        type: 'http',
        method: 'get',
        handler: sessUser
    }]
}