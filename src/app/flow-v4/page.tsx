import type { Metadata } from 'next'
import FlowV4Tiempo1 from './FlowV4Tiempo1'
import { getScenarioKey } from './mockData'

export const metadata: Metadata = {
  title: 'Flow v4 · Tiempo 1',
  robots: {
    index: false,
    follow: false,
  },
}

type FlowV4PageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function FlowV4Page({ searchParams }: FlowV4PageProps) {
  const params = await searchParams
  const initialCase = getScenarioKey(params?.case)
  return <FlowV4Tiempo1 initialCase={initialCase} />
}
