export type CheckPointInfo = {
  ID: string;
  mapName: number;
  attackAddition: number;
  defenseAddition: number;
  hpAddition: number;
  moveSpeedAddition: number;
  attackSpeedAddition: number;
};

export type BaseInfoType = {
  ID: string;
  type: string;
  name: string;
  resName: string;
  searchRadius: number;
  nearAttackRadius: number;
  attackRadius: number;
  position: string;
  angle: string;
  scale: string;
  hp: number;
  attackPower: number;
  defensePower: number;
  attackSpeed: number;
  moveSpeed: number;
  moveDuration: number;
  moveFrequency: number;
  dodgeRate: number;
  criticalHitRate: number;
  criticalHitDamage: number;
  movePattern: number;
  goldNum: number;
  heartDropRate: number;
};

export type MonsterSkillInfo = {
  ID: string;
  name: string;
  desc: string;
  type: string;
  resName: string;
  startPos: string;
  penetrate: number;
  flySpeed: number;
  warning: string;
  warningDuration: number;
  skillDuration: number;
};

export type PlayerSkillInfo = {
  ID: string;
  name: string;
  desc: string;
  range: string;
  resName: string;
  icon: string;
  value: string;
  price: number;
  speed: number;
};

export type ModelInfoType = {
  ID: string;
  position: string;
  angle: number;
  scale: string;
  skill: string;
  movePattern: number;
};
