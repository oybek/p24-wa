type UserType = 'driver' | 'passenger';

function toUserType(value: string | null): UserType | null {
  return value == 'driver' || value == 'passenger' ? value : null;
}

export { toUserType };
export type { UserType };
