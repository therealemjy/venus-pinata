import { css } from '@emotion/react';
import { useTheme } from '@mui/material';

export const useStyles = () => {
  const theme = useTheme();
  return {
    root: css`
      border-radius: ${theme.spacing(3)};
    `,
    inner: css`
      border-radius: ${theme.spacing(3)};
    `,
    topSection: css`
      margin-bottom: ${theme.spacing(8)};

      ${theme.breakpoints.down('xl')} {
        display: flex;
        align-items: center;
        margin-bottom: ${theme.spacing(7)};
      }

      ${theme.breakpoints.down('sm')} {
        display: block;
        margin-bottom: ${theme.spacing(8)};
      }
    `,
    labeledProgressBarContainer: css`
      ${theme.breakpoints.down('xl')} {
        flex: 2;
      }
    `,
    button: css`
      width: 100%;

      ${theme.breakpoints.down('xl')} {
        flex: 1;
        margin-top: 0;
        margin-left: ${theme.spacing(8)};
      }

      ${theme.breakpoints.down('sm')} {
        margin-left: 0;
      }
    `,
    votesHeader: css`
      display: flex;
      justify-content: space-between;
    `,
    votesWrapper: css`
      margin: 0;
      padding-left: 0;
      padding-right: ${theme.spacing(3)};
      width: calc(100% + ${theme.spacing(3)});
      max-height: ${theme.spacing(33)};
      overflow: hidden;
      overflow-y: auto;
    `,
    voteFrom: css`
      margin-top: ${theme.spacing(2)};
      width: 100%;
      display: inline-flex;
      justify-content: space-between;
      &:first-of-type {
        margin-top: ${theme.spacing(3)};
      }
    `,
    address: css`
      flex: 1;
      display: flex;
      align-items: center;
    `,
    blueText: css`
      color: ${theme.palette.interactive.primary};
    `,
    addressText: css`
      overflow: hidden;
      margin-right: ${theme.spacing(2)};
    `,
    reasonIcon: css`
      flex-shrink: 0;
    `,
  };
};
