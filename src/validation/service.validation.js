const Joi = require('joi');

function validateService(service) {
  const schema = Joi.object({
    name: Joi.string().max(255).required(),
    instance_name: Joi.string().max(255).optional(),
    mapping: Joi.string().max(255).required(),
    host: Joi.string().required(),
    port: Joi.number().min(1000).max(65536).required(),
    health_check_url: Joi.string().required(),
    health_check_interval: Joi.number().required(),
    timeout: Joi.number().required(),
    metadata: Joi.object({
      protocol: Joi.string().valid('http', 'https').required(),
      version: Joi.string().required(),
      environment: Joi.string().optional(),
      region: Joi.string().optional(),
    }).required(),
  });

  return schema.validate(service);
}

module.exports = {
  validateService,
};
