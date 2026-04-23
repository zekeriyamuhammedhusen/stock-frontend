import React from 'react';
import { toast } from 'react-toastify';

export const confirmToast = (message, confirmLabel = 'Confirm', cancelLabel = 'Cancel') =>
  new Promise((resolve) => {
    const id = toast.info(
      React.createElement(
        'div',
        { className: 'flex flex-col gap-2' },
        React.createElement('span', null, message),
        React.createElement(
          'div',
          { className: 'flex gap-2' },
          React.createElement(
            'button',
            {
              type: 'button',
              className: 'rounded bg-green-600 px-3 py-1 text-sm font-semibold text-white',
              onClick: () => {
                toast.dismiss(id);
                resolve(true);
              },
            },
            confirmLabel
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              className: 'rounded bg-slate-500 px-3 py-1 text-sm font-semibold text-white',
              onClick: () => {
                toast.dismiss(id);
                resolve(false);
              },
            },
            cancelLabel
          )
        )
      ),
      {
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      }
    );
  });
