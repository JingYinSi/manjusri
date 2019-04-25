const entity = require('../biz/VirtueTypes')

const list = () => {
  return entity.search({})
      .then(function (list) {
          return {
              items: list
          }
      })
}

module.exports = {
  url: '/jingyin/rests/manjusri/virtueTypes',
  rests: [{
      type: 'create',
      target: 'VirtueType',
      handler: (req) => {
        return entity.create(req.body)
      }
    },
    {
      type: 'query',
      element: 'VirtueType',
      handler: list
    }
  ]
}