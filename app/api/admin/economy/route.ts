import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'public', 'data', 'economyConfig.json');

const DEFAULT_CONFIG = {
  heartCost: 50,
  streakFreezeCost: 200,
  baseReward: 5,
  passingBonus: 10,
  perfectBonus: 5
};

async function getOrInitConfig() {
  try {
    const dataDir = path.join(process.cwd(), 'public', 'data');
    if (!fs.existsSync(dataDir)) {
      await fs.promises.mkdir(dataDir, { recursive: true });
    }
    
    if (!fs.existsSync(configPath)) {
      await fs.promises.writeFile(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf8');
      return DEFAULT_CONFIG;
    }
    
    const content = await fs.promises.readFile(configPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error getting economy config:', error);
    return DEFAULT_CONFIG;
  }
}

export async function GET() {
  const config = await getOrInitConfig();
  return NextResponse.json(config);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const updatedConfig = {
      heartCost: Number(body.heartCost ?? DEFAULT_CONFIG.heartCost),
      streakFreezeCost: Number(body.streakFreezeCost ?? DEFAULT_CONFIG.streakFreezeCost),
      baseReward: Number(body.baseReward ?? DEFAULT_CONFIG.baseReward),
      passingBonus: Number(body.passingBonus ?? DEFAULT_CONFIG.passingBonus),
      perfectBonus: Number(body.perfectBonus ?? DEFAULT_CONFIG.perfectBonus),
    };

    const dataDir = path.join(process.cwd(), 'public', 'data');
    if (!fs.existsSync(dataDir)) {
      await fs.promises.mkdir(dataDir, { recursive: true });
    }

    await fs.promises.writeFile(configPath, JSON.stringify(updatedConfig, null, 2), 'utf8');
    return NextResponse.json({ success: true, config: updatedConfig });
  } catch (error: any) {
    console.error('Error saving economy config:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
