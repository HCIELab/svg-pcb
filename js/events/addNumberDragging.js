const isDigit = ch => /[0-9]/i.test(ch) || ch === ".";

export function addNumberDragging(state, bodyListener) {
  let dragged = false;
  let num, pos_start, pos_end, sigFigs, usePrecision, selectedText;

  let pos_sign = null;
  let is_sum = false;
  let is_neg = false;

  bodyListener("mousedown", ".ͼb", e => {
    const cm = document.querySelector("code-mirror");

    const s = cm.view.state;
    const doc = s.doc;
    const pos = s.selection.main.head;
    const at = doc.lineAt(pos);

    let { from, to, text} = doc.lineAt(pos)
    let start = pos, end = pos;
    // console.log("start", start, text[start - from - 1], "end", end, text[end - from]);
    while (start > from && isDigit(text[start - from - 1], true)) start--
    while (end < to && isDigit(text[end - from])) end++

    let ch;
    if (start > from) {
        let start_sign = start;
        while (start_sign > from) {
            start_sign--;
            ch = text[start_sign - from];
            if (ch === " ") {
                continue;
            } else if (ch === "+") {
                pos_sign = start_sign;
            } else if (ch === "-") {
                pos_sign = start_sign;
                is_neg = true;
            } else if (["(", "[", ",", "/", "*", ";", "{", "=", ":"].includes(ch)) {
                break;
            } else {
                is_sum = true;
                break;
            }
        }
    }

    console.log(is_sum, is_neg, pos_sign);

    selectedText = text.slice(start-from, end-from);

    num = Number(selectedText);

    if (is_neg) {
        num = -num;
    }
    dragged = true;
    pos_start = start;
    pos_end = end;
    usePrecision = selectedText.includes(".");
    sigFigs = selectedText.includes(".") ? selectedText.split(".")[1].length : 1;
  })

  bodyListener("mousemove", "", e => {
    if (!dragged) return;
    const cm = document.querySelector("code-mirror");

        let newValue;

        let textLength = selectedText.length;

		const sign = 0 > e.movementX ? 1 : -1;
		// console.log(sign, e.movementX);
		if (usePrecision) {
			let rounded = Math.round(num*10**sigFigs);
			let newNum = rounded + e.movementX;
			newNum = Math.round(newNum)/(10**sigFigs);

			num = newNum;
            newValue = `${Math.abs(num).toFixed(sigFigs)}`;
		} else {
			num += e.movementX;
            newValue = `${Math.abs(num)}`;
		}

        if (is_sum) {
            if (pos_sign == null) {
                newValue = (num < 0 ? "-" : "+") + newValue;
            }
            cm.view.dispatch({
                changes: {from: pos_start, to: pos_start + textLength, insert: newValue}
            });
            if (pos_sign != null) {
                cm.view.dispatch({
                    changes: {from: pos_sign, to: pos_sign+1, insert: num < 0 ? "-" : "+"}
                });
            }
        } else {
            if (pos_sign != null) {
                if (num < 0) {
                    cm.view.dispatch({
                        changes: {from: pos_start, to: pos_start + textLength, insert: newValue}
                    });
                    cm.view.dispatch({
                        changes: {from: pos_sign, to: pos_sign+1, insert: "-"}
                    });
                } else {
                    cm.view.dispatch({
                        changes: {from: pos_sign, to: pos_start + textLength, insert: newValue}
                    });
                    pos_start = pos_sign;
                    pos_sign = null;
                }
            } else {
                if (num < 0) {
                    newValue = "-"+newValue;
                }
                cm.view.dispatch({
                    changes: {from: pos_start, to: pos_start + textLength, insert: newValue}
                });
            }
        }

		selectedText = newValue;

		dispatch("RUN");
		pauseEvent(e);
  })

  bodyListener("mouseup", "", e => {
    dragged = false;
    pos_sign = null;
    is_sum = false;
    is_neg = false;
  })
}
