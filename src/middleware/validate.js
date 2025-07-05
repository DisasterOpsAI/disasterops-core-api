export function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { stripUnknown: true });
    if (error) {
      const message = error.details.map(d => d.message).join(', ');
      return res.status(400).json({ error: message });
    }
    req.body = value;
    next();
  };
}