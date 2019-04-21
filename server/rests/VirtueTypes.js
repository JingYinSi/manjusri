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
  url: '/jingyin/rests/biz/virtueTypes',
  rests: [{
      type: 'create',
      target: 'VirtueType',
      handler: entity.create
    },
    {
      type: 'query',
      element: 'VirtueType',
      handler: list
    }
  ]
}