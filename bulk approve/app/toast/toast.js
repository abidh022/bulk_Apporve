let currentToast = null;

ZAGlobal.triggerToast = function (message, duration = 1000, type = 'info') {
    const fallback = typeof message === 'string' ? message : 'Notification';

    if (currentToast) {
        currentToast.toastElement.remove();
        currentToast = null;
    }

    const backgroundColor = (type === 'warning') ? '#FFA500' :
        (type === 'success') ? '#4CAF50' :
            (type === 'error') ? '#F44336' : '#2196F3';

    currentToast = Toastify({
        text: fallback,
        duration: duration,
        gravity: "top",
        position: "center",
        stopOnFocus: true,
        backgroundColor,
        // close: true, 
        transition: "linear",
        onClick: function () { }
    });
    currentToast.showToast();
};
