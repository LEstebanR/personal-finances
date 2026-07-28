import { ImageResponse } from 'next/og'

export const alt = 'LESFin — Personal finance tracker'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#059669',
          backgroundImage:
            'radial-gradient(circle at 25px 25px, rgba(255,255,255,0.08) 2.5px, transparent 0)',
          backgroundSize: '50px 50px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 110,
            height: 110,
            borderRadius: 28,
            backgroundColor: 'rgba(255,255,255,0.16)',
            marginBottom: 40,
          }}
        >
          <div
            style={{
              display: 'flex',
              width: 56,
              height: 44,
              borderRadius: 8,
              border: '5px solid white',
              position: 'relative',
            }}
          >
            <div
              style={{
                display: 'flex',
                position: 'absolute',
                right: -6,
                top: 14,
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: '#059669',
                border: '5px solid white',
              }}
            />
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 100,
            fontWeight: 800,
            color: 'white',
            letterSpacing: '-0.03em',
          }}
        >
          <span>LES</span>
          <span style={{ fontStyle: 'italic', opacity: 0.85 }}>Fin</span>
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 24,
            fontSize: 32,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.92)',
            textAlign: 'center',
            maxWidth: 880,
          }}
        >
          Cuentas, deudas, suscripciones y presupuesto en un solo lugar
        </div>
      </div>
    ),
    { ...size }
  )
}
