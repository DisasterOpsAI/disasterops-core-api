import Joi from 'joi';

export const initialFirstResponderCreationSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  name: Joi.string().min(3).max(50).required(),
  skills: Joi.array().items(Joi.string()).min(1).required(),
  contact: Joi.string().email().required(),
});

export const initialVolunteerCreationSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  name: Joi.string().min(3).max(50).required(),
  skills: Joi.array().items(Joi.string()).min(1).required(),
  contact: Joi.string().email().required(),
});

export const locationUpdateSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  timestamp: Joi.string().isoDate().required(),
});
