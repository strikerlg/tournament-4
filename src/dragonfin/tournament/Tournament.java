package dragonfin.tournament;

import java.io.*;
import java.util.*;
import com.fasterxml.jackson.core.*;
import java.sql.*;

public class Tournament
{
	String eventName;
	String eventLocation;
	String eventBeginDate;
	String eventBeginTime;
	String eventEndDate;
	String eventEndTime;
	List<Player> players = new ArrayList<Player>();
	String[] playerCustomFields = new String[0];
	String[] seatNames;

	transient boolean dirty;
	transient Connection dbConn;

	public boolean isDirty()
	{
		return dirty;
	}

	public void loadFile(File file)
		throws IOException
	{
		FileInputStream stream = new FileInputStream(file);
		JsonParser in = new JsonFactory().createJsonParser(stream);
		parse(in);
		in.close();
	}

	public void saveFile(File file)
		throws IOException
	{
		FileOutputStream stream = new FileOutputStream(file);
		JsonGenerator out = new JsonFactory().createJsonGenerator(stream);
		write(out);
		out.close();
	}

	public void parse(JsonParser in)
		throws IOException
	{
		if (in.nextToken() != JsonToken.START_OBJECT)
			throw new JsonParseException("expected START_OBJECT",
				in.getCurrentLocation());
		while (in.nextToken() != JsonToken.END_OBJECT)
		{
			String fieldName = in.getCurrentName();
			in.nextToken();
			if (fieldName.equals("eventName")) {
				eventName = in.getText();
			}
			else if (fieldName.equals("eventLocation")) {
				eventLocation = in.getText();
			}
			else if (fieldName.equals("eventBeginDate")) {
				eventBeginDate = in.getText();
			}
			else if (fieldName.equals("eventBeginTime")) {
				eventBeginTime = in.getText();
			}
			else if (fieldName.equals("eventEndDate")) {
				eventEndDate = in.getText();
			}
			else if (fieldName.equals("eventEndTime")) {
				eventEndTime = in.getText();
			}
			else if (fieldName.equals("players")) {
				parsePlayers(in);
			}
			else if (fieldName.equals("playerCustomFields")) {
				parsePlayerCustomFields(in);
			}
			else {
				in.skipChildren();
			}
		}
	}

	private void parsePlayers(JsonParser in)
		throws IOException
	{
		if (in.getCurrentToken() != JsonToken.START_ARRAY) {
			throw new JsonParseException("players: not an array",
				in.getCurrentLocation()
				);
		}

		players.clear();
		while (in.nextToken() != JsonToken.END_ARRAY) {
			Player p = new Player(this);
			p.parse(in);
			players.add(p);
		}
	}

	private void parsePlayerCustomFields(JsonParser in)
		throws IOException
	{
		if (in.getCurrentToken() != JsonToken.START_ARRAY) {
			throw new JsonParseException("playerCustomFields: not an array",
				in.getCurrentLocation()
				);
		}

		ArrayList<String> tmp = new ArrayList<String>();
		while (in.nextToken() != JsonToken.END_ARRAY) {
			String s = in.getText();
			tmp.add(s);
			in.skipChildren();
		}

		playerCustomFields = tmp.toArray(new String[0]);
	}

	public void write(JsonGenerator out)
		throws IOException
	{
		out.writeStartObject();
		out.writeStringField("eventName", eventName);
		out.writeStringField("eventLocation", eventLocation);
		out.writeStringField("eventBeginDate", eventBeginDate);
		out.writeStringField("eventBeginTime", eventBeginTime);
		out.writeStringField("eventEndDate", eventEndDate);
		out.writeStringField("eventEndTime", eventEndTime);

		if (!players.isEmpty()) {
			out.writeFieldName("players");
			out.writeStartArray();
			for (Player p : players) {
				p.write(out);
			}
			out.writeEndArray();
		}

		out.writeEndObject();
	}

	void connectDatabase()
	{
		try {

		String fileName = "db/tournamentdb";

		Class cl = Class.forName("org.hsqldb.jdbc.JDBCDriver");
		this.dbConn = DriverManager.getConnection("jdbc:hsqldb:file:"+fileName, "SA", "");

		}
		catch (Exception e) {
			throw new RuntimeException("cannot load database:"+e, e);
		}
	}

	int getSchemaVersion()
	{
		try {

			Statement stmt = dbConn.createStatement();
			stmt.execute(
			"SELECT version FROM master"
			);
			ResultSet rs = stmt.getResultSet();
			rs.next();
			return rs.getInt(1);

		}
		catch (SQLException e) {
			return 0;
		}

	}

	void upgradeSchema()
		throws SQLException
	{
		int schemaVersion = getSchemaVersion();

		if (schemaVersion < 1)
		{
			Statement stmt = dbConn.createStatement();
			stmt.execute(
			"CREATE TABLE master ("
			+" version INTEGER NOT NULL,"
			+" eventName VARCHAR(200),"
			+" eventLocation VARCHAR(200),"
			+" eventStartTime TIMESTAMP WITH TIME ZONE"
			+" )"
			);
			stmt.execute(
			"INSERT INTO master (version)"
			+" VALUES (1)"
			);

			dbConn.commit();
		}

		if (schemaVersion < 2)
		{
			Statement stmt = dbConn.createStatement();
			stmt.execute(
			"CREATE TABLE player ("
			+" id IDENTITY,"
			+" name VARCHAR(200),"
			+" memberNumber VARCHAR(200),"
			+" homeLocation VARCHAR(200)"
			+" )"
			);
			stmt.execute(
			"UPDATE master SET version=2"
			);
			dbConn.commit();
		}

		if (schemaVersion < 3)
		{
			Statement stmt = dbConn.createStatement();
			stmt.execute(
			"CREATE TABLE play ("
			+" id IDENTITY,"
			+" game VARCHAR(200),"
			+" board VARCHAR(200),"
			+" status VARCHAR(200),"
			+" started TIMESTAMP,"
			+" finished TIMESTAMP"
			+" )"
			);
			stmt.execute(
			"CREATE TABLE playparticipant ("
			+" id IDENTITY,"
			+" play INTEGER NOT NULL,"
			+" player INTEGER,"
			+" seat VARCHAR(200),"
			+" handicap VARCHAR(200),"
			+" turn_order INTEGER,"
			+" score VARCHAR(200),"
			+" rank INTEGER,"
			+" FOREIGN KEY (play) REFERENCES play (id),"
			+" FOREIGN KEY (player) REFERENCES player (id)"
			+" )"
			);
			stmt.execute(
			"ALTER TABLE master ALTER COLUMN eventName RENAME TO event_name"
			);
			stmt.execute(
			"ALTER TABLE master ALTER COLUMN eventLocation RENAME TO event_location"
			);
			stmt.execute(
			"ALTER TABLE master ALTER COLUMN eventStartTime RENAME TO event_start_time"
			);
			stmt.execute(
			"ALTER TABLE player ALTER COLUMN memberNumber RENAME TO member_number"
			);
			stmt.execute(
			"ALTER TABLE player ALTER COLUMN homeLocation RENAME TO home_location"
			);
			stmt.execute(
			"UPDATE master SET version=3"
			);
			dbConn.commit();
		}

		if (schemaVersion < 4)
		{
			Statement stmt = dbConn.createStatement();
			stmt.execute(
			"CREATE TABLE column_type ("
			+" name VARCHAR(200) NOT NULL PRIMARY KEY,"
			+" type_data VARCHAR(4000)"
			+" )"
			);
			stmt.execute(
			"INSERT INTO column_type (name,type_data) VALUES ("
			+" 'PLAY.STATUS',"
			+" 'enum:proposed,assigned,started,suspended,aborted,completed'"
			+" )"
			);
			stmt.execute(
			"UPDATE master SET version=4"
			);
			dbConn.commit();
		}

		if (schemaVersion < 5)
		{
			Statement stmt = dbConn.createStatement();
			stmt.execute(
			"ALTER TABLE master"
			+" ADD COLUMN seat_names VARCHAR(4000) DEFAULT 'White,Black' NOT NULL"
			);
			stmt.execute(
			"ALTER TABLE play"
			+" ADD COLUMN round VARCHAR(200)"
			);
			stmt.execute(
			"UPDATE master SET version=5"
			);
			dbConn.commit();
		}
	}

	void loadMasterData()
		throws SQLException
	{
		Statement stmt = dbConn.createStatement();
		stmt.execute(
		"SELECT event_name,event_location,event_start_time,seat_names"
		+" FROM master"
		);
		ResultSet rs = stmt.getResultSet();
		rs.next();
		eventName = rs.getString(1);
		eventLocation = rs.getString(2);
		eventBeginDate = rs.getString(3);

		String tmp = rs.getString(4);
		seatNames = tmp.split(",");
	}

	public String getColumnTypeData(String columnName)
		throws SQLException
	{
		PreparedStatement stmt = dbConn.prepareStatement(
			"SELECT type_data FROM column_type"
			+" WHERE name=?"
			);
		stmt.setString(1, columnName);
		ResultSet rs = stmt.executeQuery();
		if (rs.next()) {
			return rs.getString(1);
		}
		return null;
	}

	public ResultSetModel getPlayersModel()
	{
		try {
			Statement stmt = dbConn.createStatement();
			stmt.execute(
			"SELECT * FROM player"
			);
			ResultSetModel m = new ResultSetModel(stmt.getResultSet());
			m.updateHandler = new MyPlayerUpdater();
			return m;
		}
		catch (SQLException e) {
			throw new RuntimeException("SQL exception: "+e, e);
		}
	}

	public ResultSetModel getPlaysModel()
	{
		try {
			Statement stmt = dbConn.createStatement();
			stmt.execute(
			"SELECT id,game,board,status,"
			+" id+0 AS players,started,finished FROM play"
			);
			ResultSetModel m = new ResultSetModel(stmt.getResultSet());
			m.updateHandler = new MyPlayUpdater();
			return m;
		}
		catch (SQLException e) {
			throw new RuntimeException("SQL exception: "+e, e);
		}
	}

	public void addPlayer()
		throws SQLException
	{
		Statement stmt = dbConn.createStatement();
		stmt.execute(
			"INSERT INTO player (name) VALUES (NULL)"
			);
	}

	public void addPlay()
		throws SQLException
	{
		Statement stmt = dbConn.createStatement();
		stmt.execute(
			"INSERT INTO play (game) VALUES (NULL)"
			);
	}

	class MyPlayerUpdater implements ResultSetModel.UpdateHandler
	{
		public void update(Object key, String attrName, Object newValue)
			throws SQLException
		{
			PreparedStatement stmt = dbConn.prepareStatement(
				"UPDATE player SET "
				+quoteSchemaName(attrName)+"=?"
				+" WHERE id=?"
				);
			stmt.setObject(1, newValue);
			stmt.setObject(2, key);
			stmt.executeUpdate();
		}
	}

	class MyPlayUpdater implements ResultSetModel.UpdateHandler
	{
		public void update(Object key, String attrName, Object newValue)
			throws SQLException
		{
			PreparedStatement stmt = dbConn.prepareStatement(
				"UPDATE play SET "
				+quoteSchemaName(attrName)+"=?"
				+" WHERE id=?"
				);
			stmt.setObject(1, newValue);
			stmt.setObject(2, key);
			stmt.executeUpdate();
		}
	}

	static String quoteSchemaName(String s)
	{
		assert s != null;
		return "\"" + s + "\"";
	}

	public Play getPlay(int playId)
	{
		return new Play(this, playId);
	}
}
