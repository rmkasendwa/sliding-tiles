import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import FullscreenIcon from '@material-ui/icons/Fullscreen';
import { createTheme, ThemeProvider } from '@material-ui/core/styles';
import React from 'react';
import Board from './components/Board';
import { AudioProvider } from './contexts';
import { useRef } from 'react';

interface IAppProps {}

const theme = createTheme({
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '@global': {
          html: {
            position: 'relative',
            minHeight: '100%',
          },
          body: {
            margin: 0,
            height: '100%',
            fontFamily: 'RobotoRegular, sans-serif',
            cursor: 'default',
            backgroundColor: 'whitesmoke',
            color: '#282f3e',
            '-webkit-touch-callout': 'none',
            '-webkit-user-select': 'none',
            '-khtml-user-select': 'none',
            '-moz-user-select': 'none',
            '-ms-user-select': 'none',
            'user-select': 'none',
            '-webkit-font-smoothing': 'antialiased',
            '-moz-osx-font-smoothing': 'grayscale',
          },
          code: {
            fontFamily:
              "source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace",
          },
          pre: {
            margin: 0,
            padding: 0,
          },
        },
      },
    },
  },
});

const App: React.FC<IAppProps> = () => {
  const boardWrapperRef = useRef();
  const handleClickFullScreenButton = () => {
    if (boardWrapperRef.current) {
      const boardWrapperNode: any = boardWrapperRef.current!;
      if (boardWrapperNode.requestFullscreen) {
        boardWrapperNode.requestFullscreen();
      } else if (boardWrapperNode.webkitRequestFullscreen) {
        /* Safari */
        boardWrapperNode.webkitRequestFullscreen();
      } else if (boardWrapperNode.msRequestFullscreen) {
        /* IE11 */
        boardWrapperNode.msRequestFullscreen();
      }
    }
  };
  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          bgcolor: '#262626',
          boxSizing: 'border-box',
          p: 3,
        }}
      >
        <Box
          ref={boardWrapperRef}
          sx={{
            width: '100%',
            height: '100%',
          }}
        >
          <AudioProvider>
            <Board />
          </AudioProvider>
        </Box>
        <IconButton
          onClick={handleClickFullScreenButton}
          sx={{ position: 'absolute', bottom: 5, right: 5, color: '#fff' }}
          size="large"
        >
          <FullscreenIcon sx={{ fontSize: '1.2em' }} />
        </IconButton>
      </Box>
    </ThemeProvider>
  );
};

export default App;
