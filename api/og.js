const satori = require('satori').default;
const { Resvg } = require('@resvg/resvg-js');

let cachedFont = null;

module.exports = async function handler(req, res) {
  try {
    const { name = 'Usuário', msg = 'Mensagem recebida!' } = req.query;
    
    if (!cachedFont) {
      const fontRes = await fetch('https://raw.githubusercontent.com/Gissio/font_Tiny5/main/fonts/ttf/Tiny5-Regular.ttf');
      cachedFont = await fontRes.arrayBuffer();
    }
    const fontData = cachedFont;

    const svg = await satori(
      {
        type: 'div',
        props: {
          style: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#121212',
            color: '#8fbc8b',
            width: '100%',
            height: '100%',
            padding: '60px',
          },
          children: [
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  height: '100%',
                  borderTop: '4px solid #8fbc8b',
                  borderBottom: '4px solid #8fbc8b',
                  padding: '40px 0',
                  justifyContent: 'center'
                },
                children: [
                  {
                    type: 'div',
                    props: {
                      style: { fontSize: 32, fontFamily: 'Tiny5', opacity: 0.6, marginBottom: '20px' },
                      children: '// recebido'
                    }
                  },
                  {
                    type: 'div',
                    props: {
                      style: { fontSize: 90, fontFamily: 'Tiny5', marginBottom: '30px' },
                      children: `Olá, ${name}`
                    }
                  },
                  {
                    type: 'div',
                    props: {
                      style: { fontSize: 40, fontFamily: 'Tiny5', opacity: 0.9, marginBottom: '60px' },
                      children: 'Sua mensagem pousou na minha caixa de entrada!'
                    }
                  },
                  {
                    type: 'div',
                    props: {
                      style: { display: 'flex', flexDirection: 'row', borderLeft: '4px solid #8fbc8b', paddingLeft: '20px' },
                      children: [
                        {
                          type: 'div',
                          props: {
                            style: { display: 'flex', flexDirection: 'column' },
                            children: [
                              {
                                type: 'div',
                                props: { style: { fontSize: 36, fontFamily: 'Tiny5', marginBottom: '10px' }, children: 'Aviso do Sistema' }
                              },
                              {
                                type: 'div',
                                props: { style: { fontSize: 32, fontFamily: 'Tiny5', opacity: 0.6 }, children: `"${msg}"` }
                              }
                            ]
                          }
                        }
                      ]
                    }
                  }
                ]
              }
            }
          ]
        }
      },
      {
        width: 1200,
        height: 600,
        fonts: [
          {
            name: 'Tiny5',
            data: fontData,
            weight: 400,
            style: 'normal',
          },
        ],
      }
    );

    const resvg = new Resvg(svg, {
      background: '#121212',
      fitTo: {
        mode: 'width',
        value: 1200
      }
    });
    
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(pngBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).send(`Error: ${error.message}\nStack: ${error.stack}`);
  }
};
