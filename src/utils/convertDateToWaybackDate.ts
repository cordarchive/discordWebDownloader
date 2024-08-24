export function convertDateToWaybackDate(date: any, daysBefore?: any) {
    let convertedDate = new Date(Date.parse(date));
    if (daysBefore) {
        convertedDate.setDate(convertedDate.getDate() - daysBefore)
    }
    return `${convertedDate.getFullYear()}${(
      convertedDate.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}${(convertedDate.getDate() - 1)
      .toString()
      .padStart(2, "0")}`;
}