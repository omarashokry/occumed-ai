import { NextResponse } from 'next/server';

const MCQ_TOPICS = [
  {
    id: 'mixed-practice',
    name: 'Mixed Practice',
    description: 'Questions from all topics and all ingested material',
    regulations: ['All regulations'],
  },
  {
    id: 'noise-induced-hearing-loss',
    name: 'Noise-Induced Hearing Loss',
    description: 'Assessment and management of occupational noise exposure',
    regulations: ['L108', 'Control of Noise at Work Regulations 2005'],
  },
  {
    id: 'hand-arm-vibration',
    name: 'Hand-Arm Vibration Syndrome',
    description: 'Diagnosis and management of HAVS in workers',
    regulations: ['L140', 'Control of Vibration at Work Regulations 2005'],
  },
  {
    id: 'workplace-stress',
    name: 'Work-Related Stress',
    description: 'Assessing and managing occupational stress and mental health',
    regulations: ['L74', 'Management of Health and Safety at Work Regulations'],
  },
  {
    id: 'hazardous-substances',
    name: 'Hazardous Substance Exposure',
    description: 'COSHH assessment and health surveillance',
    regulations: ['L5', 'COSHH Regulations 2002'],
  },
  {
    id: 'workplace-injury',
    name: 'Workplace Injury Assessment',
    description: 'Assessment of fitness to work following workplace injury',
    regulations: ['L74', 'Management of Health and Safety at Work Regulations'],
  },
  {
    id: 'fitness-to-work',
    name: 'Fitness to Work Assessment',
    description: 'Pre-employment and periodic health assessment',
    regulations: ['L24', 'Workplace Health, Safety and Welfare Regulations'],
  },
  {
    id: 'respiratory-surveillance',
    name: 'Respiratory Health Surveillance',
    description: 'Occupational asthma and respiratory disease surveillance',
    regulations: ['L5', 'COSHH Regulations 2002'],
  },
  {
    id: 'skin-disease',
    name: 'Occupational Skin Disease',
    description: 'Assessment of occupational dermatitis and skin exposure',
    regulations: ['L5', 'COSHH Regulations 2002'],
  },
];

export async function GET() {
  return NextResponse.json({ topics: MCQ_TOPICS });
}
