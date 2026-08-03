async function main() {
  console.log('[seed]  Seeding IPOPilot database...')

  try {
    const response = await fetch(
      'https://backend.cdsc.com.np/api/meroShare/capital/',
      { headers: { Accept: 'application/json' } },
    )

    if (!response.ok) {
      throw new Error(`CDSC API returned ${response.status} ${response.statusText}`)
    }

    const dps = (await response.json()) as Array<{ id: number; code: string; name: string }>
    console.log(`[Y]  Fetched ${dps.length} Depository Participants from CDSC`)
    console.log(`   First 5: ${dps.slice(0, 5).map((d) => d.name).join(', ')}`)
    console.log(`   Last 5:  ${dps.slice(-5).map((d) => d.name).join(', ')}`)
  } catch (err) {
    console.error('[N]  Failed to fetch DPs:', err instanceof Error ? err.message : err)
    process.exit(1)
  }

  console.log('[seed]  Seed complete.')
}

main()
