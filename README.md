# factory5_testtask

# Допущения, сделанные для решения общей задачи
0. Передаются все данные в функцию корректно 
1. dataStart, dataEnd приходят в формате unix-timestamp
2. dataStart, dataEnd приходят с крайним значениями (6:00 для dataStart, 23:00 для dataEnd), иначе возможно попасть на фиксацию подозрительной деятельности
3. Подразумевается, что между границами диапозона может быть любое количество дней.
4. При подсчете некорректно следующих данных (вход и выход не друг за другом) используется следующий подход: в случаях, когда type 'in' идут подряд, берётся первый вход. При type 'out' наоборот, последний выход.
5. Все записи считаются внутри дня (с 6 до 23), ночное время, в расчет не берётся.
6. В случаях, когда одна из записей отсутствует (in || out) время считается с учетом краевых значений внутри дня. (пример: одна запись out в 8:00, за день посчитает 2 часа). 
