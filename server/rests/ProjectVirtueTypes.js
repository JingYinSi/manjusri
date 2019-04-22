const entity = require('../biz/VirtueTypes')

const list = (query, req) => {
  return entity.search({project: req.params.id})
    .then(function (list) {
      return {
        items: list
      }
    })
}

module.exports = {
  url: '/jingyin/rests/biz/project/:id/virtueTypes',
  rests: [{
      type: 'create',
      target: 'VirtueType',
      handler: (req) => {
        return entity.create({
            ...req.body,
            project: req.params.id
          })
      }
    },
    {
      type: 'query',
      element: 'VirtueType',
      handler: list
    }
  ]
}