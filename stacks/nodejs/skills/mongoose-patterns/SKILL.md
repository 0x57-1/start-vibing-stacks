# Mongoose Patterns — MongoDB ODM

**ALWAYS invoke when writing Mongoose schemas, queries, or aggregations.**

## Schema Pattern

```typescript
import { Schema, model, type InferSchemaType } from 'mongoose';

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, minlength: 2 },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  role: { type: String, enum: ['admin', 'user', 'moderator'] as const, default: 'user' },
  profile: {
    avatar: String,
    bio: { type: String, maxlength: 500 },
  },
  tags: [{ type: String, index: true }],
  isActive: { type: Boolean, default: true, index: true },
}, {
  timestamps: true,         // createdAt, updatedAt
  toJSON: { virtuals: true, transform: (_, ret) => { delete ret.__v; return ret; } },
});

// Compound index
userSchema.index({ email: 1, isActive: 1 });
// Text index for search
userSchema.index({ name: 'text', 'profile.bio': 'text' });

type IUser = InferSchemaType<typeof userSchema>;
export const User = model('User', userSchema);
```

## Query Patterns

```typescript
// Pagination
async function paginate(page: number, limit: number) {
  const [items, total] = await Promise.all([
    User.find({ isActive: true }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments({ isActive: true }),
  ]);
  return { items, total, pages: Math.ceil(total / limit) };
}

// Aggregation
const stats = await User.aggregate([
  { $match: { isActive: true } },
  { $group: { _id: '$role', count: { $sum: 1 }, avgAge: { $avg: '$age' } } },
  { $sort: { count: -1 } },
]);
```

## Middleware

```typescript
// Pre-save: hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Pre-find: exclude inactive by default
userSchema.pre(/^find/, function (next) {
  this.where({ isActive: { $ne: false } });
  next();
});
```

## FORBIDDEN

1. **No indexes on queried fields** — always index filter/sort fields
2. **`find()` without `.lean()`** for read-only — wastes memory
3. **Unbounded queries** — always `.limit()`
4. **N+1 queries** — use `.populate()` or aggregation `$lookup`
5. **String IDs without casting** — use `new Types.ObjectId(id)`
