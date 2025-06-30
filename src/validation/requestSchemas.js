import Joi from 'joi';

const attachmentSchema = Joi.object({
  type: Joi.string().valid('image', 'audio', 'video', 'document').required(),
  url: Joi.string().uri().required(),
});

const createRequestSchema = Joi.object({
  name: Joi.string().min(1).required(),
  contactInfo: Joi.string().email().required(),
  location: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
  }).required(),
  description: Joi.string().min(5).required(),
  attachments: Joi.array().items(attachmentSchema).default([]),
});

const updateRequestSchema = Joi.object({
  additionalInfo: Joi.string().min(1).optional(),
  newAttachments: Joi.array().items(attachmentSchema).default([]),
}).or('additionalInfo', 'newAttachments');

module.exports = {
  createRequestSchema,
  updateRequestSchema,
};
