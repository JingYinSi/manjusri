const entity = require('../biz/Projects')

const list = () => {
  return entity.search({})
      .then(function (list) {
          return {
              items: list
          }
      })
}

module.exports = {
  url: '/jingyin/rests/biz/projects',
  rests: [{
      type: 'create',
      target: 'Project',
      handler: entity.create
    },
    {
      type: 'query',
      element: 'Project',
      handler: list
    }
  ]
}